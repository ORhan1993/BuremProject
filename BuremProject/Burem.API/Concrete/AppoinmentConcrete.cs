using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data;
using Burem.Data.Enums;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Nager.Date;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class AppointmentConcrete : IAppointmentService
    {
        private readonly BuremDbContext _context;
        private readonly MailHelper _mailHelper;

        public AppointmentConcrete(BuremDbContext context, IConfiguration config)
        {
            _context = context;
            _mailHelper = new MailHelper(config);
        }

        // ========================================================================
        // 1. MÜSAİTLİK KONTROLÜ (HİBRİT YAPI)
        // ========================================================================
        public async Task<List<int>> GetAvailableHoursAsync(int therapistId, DateTime date)
        {
            // Terapist aktif mi?
            var therapist = await _context.Therapists.FindAsync(therapistId);
            if (therapist == null || !therapist.IsActive) return new List<int>();

            // Tatil mi?
            if (await IsHolidayAsync(date)) return new List<int>();

            // Dolu saatleri çek
            var bookedHours = await _context.Appointments
                .Where(x => x.TherapistId == therapistId &&
                            x.AppointmentDate.Date == date.Date &&
                            x.Status != AppointmentStatus.Cancelled &&
                            !x.IsDeleted) // Silinenleri hariç tut
                .Select(x => x.AppointmentDate.Hour)
                .ToListAsync();

            var availableHours = new List<int>();
            // Mesai saatleri: 09:00 - 16:00
            for (int i = 9; i <= 16; i++)
            {
                if (i == 12) continue; // 12:00 - 13:00 Öğle Arası
                if (!bookedHours.Contains(i)) availableHours.Add(i);
            }
            return availableHours;
        }

        // ========================================================================
        // 2. MÜSAİT TERAPİSTLERİ LİSTELEME
        // ========================================================================
        public async Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category)
        {
            var query = _context.Therapists
                .AsNoTracking()
                .Include(t => t.TherapistType)
                .Include(t => t.Campus)
                .Where(t => t.IsActive);

            if (!string.IsNullOrEmpty(category) && category != "Tümü")
            {
                query = query.Where(t => t.TherapistType.Name == category);
            }

            var activeTherapists = await query.OrderBy(t => t.FirstName).ToListAsync();
            var result = new List<TherapistAvailabilityDto>();

            foreach (var t in activeTherapists)
            {
                // Gelecekteki aktif randevu sayısını (İş Yükü) hesapla
                int currentLoad = await _context.Appointments
                    .CountAsync(a => a.TherapistId == t.Id
                                  && a.AppointmentDate >= DateTime.Now
                                  && a.Status != AppointmentStatus.Cancelled
                                  && !a.IsDeleted);

                result.Add(new TherapistAvailabilityDto
                {
                    Id = t.Id,
                    Name = $"{t.FirstName} {t.LastName}",
                    Category = t.TherapistType?.Name ?? "Genel Uzman",
                    Campus = t.Campus?.Name ?? "Merkez Kampüs",
                    CurrentLoad = currentLoad,
                    // Basit Algoritma: Günde 5 slot kapasitesi varsayımı
                    DailySlots = Math.Max(0, 5 - (currentLoad % 5)),
                    WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
                });
            }
            return result;
        }

        // ========================================================================
        // 3. RANDEVU OLUŞTURMA (Create)
        // ========================================================================
        public async Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            try
            {
                // A. Validasyonlar
                if (dto.SessionId == null || dto.SessionId == 0) return new ServiceResultDto { IsSuccess = false, Message = "Başvuru ID bulunamadı." };
                if (dto.TherapistId == null || dto.TherapistId == 0) return new ServiceResultDto { IsSuccess = false, Message = "Terapist seçilmedi." };

                var therapist = await _context.Therapists.FindAsync(dto.TherapistId);
                if (therapist == null || !therapist.IsActive) return new ServiceResultDto { IsSuccess = false, Message = "Seçilen terapist aktif değil." };

                // B. Tarih Formatlama (Esnek Yapı)
                DateTime appointmentDateTime;
                bool isDateValid = DateTime.TryParseExact(dto.AppointmentDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var datePart);

                if (!isDateValid)
                {
                    // Frontend bazen dd.MM.yyyy gönderebilir, onu da deneyelim
                    isDateValid = DateTime.TryParseExact(dto.AppointmentDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out datePart);
                }

                if (!isDateValid) return new ServiceResultDto { IsSuccess = false, Message = "Tarih formatı geçersiz." };

                var timePart = TimeSpan.Parse(dto.AppointmentHour);
                appointmentDateTime = datePart.Add(timePart);

                // C. Zaman Kontrolleri
                if (appointmentDateTime < DateTime.Now) return new ServiceResultDto { IsSuccess = false, Message = "Geçmişe randevu verilemez." };
                if (appointmentDateTime.Hour == 12) return new ServiceResultDto { IsSuccess = false, Message = "12:00 - 13:00 arası öğle tatilidir." };
                if (await IsHolidayAsync(appointmentDateTime)) return new ServiceResultDto { IsSuccess = false, Message = "Seçilen tarih tatil günüdür." };

                // D. Oturum ve Öğrenci Kontrolü
                var session = await _context.Sessions.Include(s => s.Student).FirstOrDefaultAsync(s => s.Id == dto.SessionId);
                if (session == null) return new ServiceResultDto { IsSuccess = false, Message = "Başvuru bulunamadı." };

                // Öğrenci User tablosunda var mı? (Mail ve ID için gerekli)
                var studentUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == session.Student.StudentNo && u.RoleId == 3 && u.IsDeleted == 0);
                if (studentUser == null) return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci kullanıcısı sistemde bulunamadı." };

                // E. 8 Seans Sınırı
                int appointmentCount = await _context.Appointments
                    .CountAsync(a => a.UserId == studentUser.Id && a.SessionId == dto.SessionId && a.Status != AppointmentStatus.Cancelled && !a.IsDeleted);

                if (appointmentCount >= 8) return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci 8 seans sınırını doldurmuştur." };

                // F. Çakışma Kontrolü (Concurrency)
                var endDate = appointmentDateTime.AddMinutes(50);
                bool isTaken = await _context.Appointments.AnyAsync(x =>
                    x.TherapistId == dto.TherapistId &&
                    x.Status != AppointmentStatus.Cancelled &&
                    !x.IsDeleted &&
                    ((appointmentDateTime >= x.AppointmentDate && appointmentDateTime < x.EndDate) ||
                     (endDate > x.AppointmentDate && endDate <= x.EndDate)));

                if (isTaken) return new ServiceResultDto { IsSuccess = false, Message = "Seçilen saatte terapistin başka bir randevusu mevcut." };

                // G. Kayıt İşlemi
                var appointment = new Appointment
                {
                    SessionId = dto.SessionId.Value,
                    TherapistId = dto.TherapistId.Value,
                    UserId = studentUser.Id,
                    AppointmentDate = appointmentDateTime,
                    AppointmentHour = dto.AppointmentHour,
                    EndDate = endDate,
                    Status = AppointmentStatus.Planned,
                    AppointmentType = dto.AppointmentType ?? "Yüz Yüze",
                    LocationOrLink = dto.LocationOrLink ?? "Merkez Ofis",
                    CreatedAt = DateTime.Now,
                    SessionNumber = appointmentCount + 1, // Otomatik artan seans no
                    IsDeleted = false
                };

                _context.Appointments.Add(appointment);

                // Session tablosunu güncelle
                session.AdvisorId = dto.TherapistId.Value;
                session.Status = "Devam Ediyor";

                await _context.SaveChangesAsync();

                // H. Mail Gönderimi (User tablosundaki mail adresine)
                _ = Task.Run(() => SendEmailSafe(studentUser.Email, session.Student, therapist, appointmentDateTime, dto));

                return new ServiceResultDto { IsSuccess = true, Message = "Randevu oluşturuldu." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }

        // ========================================================================
        // 4. DURUM GÜNCELLEME (İptal/Tamamlandı)
        // ========================================================================
        public async Task<ServiceResultDto> UpdateStatusAsync(UpdateAppointmentStatusDto model)
        {
            try
            {
                var apt = await _context.Appointments
                            .Include(a => a.Session)
                            .Include(a => a.User)
                            .Include(a => a.Therapist)
                            .FirstOrDefaultAsync(a => a.Id == model.AppointmentId);

                if (apt == null) return new ServiceResultDto { IsSuccess = false, Message = "Randevu bulunamadı." };

                apt.Status = (AppointmentStatus)model.Status;

                // Durum: İptal veya Gelmedi
                if (apt.Status == AppointmentStatus.Cancelled || apt.Status == AppointmentStatus.NoShow)
                {
                    apt.CancellationReason = model.Reason;

                    // İptal Maili
                    if (apt.User != null && !string.IsNullOrEmpty(apt.User.Email))
                    {
                        _ = Task.Run(() => _mailHelper.SendCancellationEmail(
                                apt.User.Email,
                                $"{CryptoHelper.Decrypt(apt.User.FirstName)} {CryptoHelper.Decrypt(apt.User.LastName)}",
                                apt.AppointmentDate.ToString("dd.MM.yyyy"),
                                apt.AppointmentDate.ToString("HH:mm"),
                                model.Reason ?? "Belirtilmedi"));
                    }
                }
                // Durum: Tamamlandı
                else if (apt.Status == AppointmentStatus.Completed)
                {
                    if (apt.Session != null)
                    {
                        // Terapist notlarını Session tablosuna kaydet
                        apt.Session.TherapistNotes = model.TherapistNotes;
                        apt.Session.RiskLevel = model.RiskLevel;

                        if (!string.IsNullOrEmpty(model.ReferralDestination))
                        {
                            apt.Session.ReferralDestination = model.ReferralDestination;
                            apt.Session.Status = "Yönlendirildi";
                        }
                    }

                    // Değerlendirme Maili (Opsiyonel)
                    /* if (apt.User != null && !string.IsNullOrEmpty(apt.User.Email)) { ... SendEvaluationEmail ... }
                    */
                }

                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Durum güncellendi." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }

        // ========================================================================
        // 5. RAPORLAMA VE LİSTELEME
        // ========================================================================

        // Terapist Paneli için Dashboard Verisi (Takvim görünümü vb.)
        public async Task<List<TherapistDashboardDto>> GetTherapistScheduleAsync(int therapistId)
        {
            var appointments = await _context.Appointments
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Session)
                .Where(a => a.TherapistId == therapistId && !a.IsDeleted)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return appointments.Select(a => new TherapistDashboardDto
            {
                Id = a.Id,
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentDate.ToString("HH:mm"),
                StudentName = a.User != null
                    ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}"
                    : "Bilinmeyen",
                StudentId = a.User?.UserName ?? "-",
                Type = a.AppointmentType,
                Status = a.Status.ToString(),
                Note = a.Session?.TherapistNotes ?? "",
                CurrentSessionCount = a.SessionNumber
            }).ToList();
        }

        // Admin/Sekreter Paneli için TÜM Randevular
        public async Task<List<AppointmentDetailDto>> GetAllAppointmentsAsync()
        {
            var appointments = await _context.Appointments
               .AsNoTracking()
               .Include(a => a.User)
               .Include(a => a.Therapist)
               .Where(a => a.Status != AppointmentStatus.Cancelled && !a.IsDeleted)
               .OrderByDescending(a => a.AppointmentDate)
               .ToListAsync();

            return appointments.Select(a => MapToDto(a)).ToList();
        }

        // Terapist Paneli için SADECE KENDİ Randevuları
        public async Task<List<TherapistAppointmentDto>> GetTherapistAppointmentsAsync(int therapistId)
        {
            var appointments = await _context.Appointments
                .AsNoTracking()
                .Include(a => a.User)
                .Where(a => a.TherapistId == therapistId)
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            // Mapping işlemini DTO'ya çevirerek yapıyoruz
            return appointments.Select(a => new TherapistAppointmentDto
            {
                Id = a.Id,
                // Şifreli isimleri çöz
                StudentName = a.User != null
                    ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}"
                    : "Bilinmeyen",

                StudentId = a.User != null ? a.User.UserName : string.Empty,
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentDate.ToString("HH:mm"),
                Type = a.AppointmentType ?? "Genel",
                Status = a.Status.ToString(),
                Note = a.Description ?? "Not girilmemiş",
                CurrentSessionCount = a.SessionNumber
            }).ToList();
        }

        // ========================================================================
        // 6. ÖZEL TATİL EKLEME
        // ========================================================================
        public async Task<ServiceResultDto> AddCustomHolidayAsync(AddHolidayDto dto)
        {
            try
            {
                // Sadece Admin(1) ve Sekreter(2) ekleyebilir
                if (dto.CurrentUserRoleId != 1 && dto.CurrentUserRoleId != 2)
                    return new ServiceResultDto { IsSuccess = false, Message = "Yetkiniz yok." };

                DateTime holidayDate;
                if (!DateTime.TryParseExact(dto.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out holidayDate))
                    return new ServiceResultDto { IsSuccess = false, Message = "Geçersiz tarih formatı." };

                if (holidayDate < DateTime.Today)
                    return new ServiceResultDto { IsSuccess = false, Message = "Geçmişe tatil eklenemez." };

                bool exists = await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == holidayDate);
                if (exists) return new ServiceResultDto { IsSuccess = false, Message = "Bu tarih zaten tatil." };

                var holiday = new UniversityCustomHoliday
                {
                    HolidayDate = holidayDate,
                    Description = dto.Description ?? "İdari İzin"
                };

                _context.UniversityCustomHolidays.Add(holiday);
                await _context.SaveChangesAsync();

                return new ServiceResultDto { IsSuccess = true, Message = "Tatil eklendi." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }

        // ========================================================================
        // PRIVATE HELPERS
        // ========================================================================
        public async Task<bool> IsHolidayAsync(DateTime date)
        {
            // Hafta sonu kontrolü
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) return true;

            // Resmi tatil kontrolü (Nager.Date kütüphanesi)
            if (HolidaySystem.IsPublicHoliday(date, CountryCode.TR)) return true;

            // Veritabanındaki özel tatiller
            return await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == date.Date);
        }

        private AppointmentDetailDto MapToDto(Appointment a)
        {
            return new AppointmentDetailDto
            {
                Id = a.Id,
                StudentName = a.User != null ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}" : "Bilinmeyen",
                TherapistName = a.Therapist != null ? $"{a.Therapist.FirstName} {a.Therapist.LastName}" : "Bilinmeyen",
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentHour,
                Status = a.Status.ToString(),
                Type = a.AppointmentType
            };
        }

        private async Task SendEmailSafe(string email, Student student, Therapist therapist, DateTime date, CreateAppointmentDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(email)) return;
                string tName = therapist != null ? $"{therapist.FirstName} {therapist.LastName}" : "Uzman";
                _mailHelper.SendAppointmentEmail(email, $"{student.FirstName} {student.LastName}", tName, date.ToString("dd.MM.yyyy"), dto.AppointmentHour, dto.AppointmentType ?? "Genel", dto.LocationOrLink ?? "");
            }
            catch (Exception ex) { Console.WriteLine("Mail Hatası: " + ex.Message); }
        }
    }
}