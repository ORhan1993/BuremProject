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
        // 1. MÜSAİTLİK KONTROLÜ
        // ========================================================================
        public async Task<List<int>> GetAvailableHoursAsync(int therapistId, DateTime date)
        {
            var therapist = await _context.Therapists.FindAsync(therapistId);
            if (therapist == null || !therapist.IsActive) return new List<int>();

            if (await IsHolidayAsync(date)) return new List<int>();

            var bookedHours = await _context.Appointments
                .Where(x => x.TherapistId == therapistId &&
                            x.AppointmentDate.Date == date.Date &&
                            x.Status != AppointmentStatus.Cancelled &&
                            !x.IsDeleted)
                .Select(x => x.AppointmentDate.Hour)
                .ToListAsync();

            var availableHours = new List<int>();
            for (int i = 9; i <= 16; i++)
            {
                if (i == 12) continue;
                if (!bookedHours.Contains(i)) availableHours.Add(i);
            }
            return availableHours;
        }

        // ========================================================================
        // 2. MÜSAİT TERAPİSTLERİ GETİRME
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
                    DailySlots = Math.Max(0, 5 - (currentLoad % 5)),
                    WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
                });
            }
            return result;
        }

        // ========================================================================
        // 3. RANDEVU OLUŞTURMA
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

                // B. Tarih Formatlama
                DateTime appointmentDateTime;
                bool isDateValid = DateTime.TryParseExact(dto.AppointmentDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var datePart);
                if (!isDateValid) isDateValid = DateTime.TryParseExact(dto.AppointmentDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out datePart);
                if (!isDateValid) return new ServiceResultDto { IsSuccess = false, Message = "Tarih formatı geçersiz." };

                var timePart = TimeSpan.Parse(dto.AppointmentHour);
                appointmentDateTime = datePart.Add(timePart);

                // C. Zaman Kontrolleri
                if (appointmentDateTime < DateTime.Now) return new ServiceResultDto { IsSuccess = false, Message = "Geçmişe randevu verilemez." };
                if (appointmentDateTime.Hour == 12) return new ServiceResultDto { IsSuccess = false, Message = "12:00 - 13:00 arası öğle tatilidir." };
                try { if (await IsHolidayAsync(appointmentDateTime)) return new ServiceResultDto { IsSuccess = false, Message = "Seçilen tarih tatil günüdür." }; } catch { }

                // D. Oturum ve Öğrenci Kontrolü
                var session = await _context.Sessions.Include(s => s.Student).FirstOrDefaultAsync(s => s.Id == dto.SessionId);
                if (session == null) return new ServiceResultDto { IsSuccess = false, Message = "Başvuru bulunamadı." };

                var studentUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == session.Student.StudentNo && u.RoleId == 3 && u.IsDeleted == 0);

                // ==========================================================================================
                // YENİ MANTIK: İLK RANDEVU VE HAK KONTROLÜ
                // ==========================================================================================

                // Bu başvuruya ait daha önce verilmiş (iptal edilmemiş) randevuları çek
                var existingAppointments = await _context.Appointments
                    .Where(a => a.SessionId == dto.SessionId && !a.IsDeleted && a.Status != AppointmentStatus.Cancelled)
                    .ToListAsync();

                // Eğer liste boşsa, bu "İlk Randevu"dur (Ön Görüşme)
                bool isFirstAppointment = !existingAppointments.Any();

                // Henüz tamamlanmamış (Planlanmış) randevu var mı? (Çakışma önlemek için)
                bool hasPending = existingAppointments.Any(a => a.Status == AppointmentStatus.Planned);
                if (hasPending)
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Öğrencinin zaten planlanmış (henüz yapılmamış) bir randevusu var." };
                }

                int newSessionNumber = 0;

                if (isFirstAppointment)
                {
                    // KURAL 1: İlk randevuyu sadece Sekreter (2) veya Admin (1) verebilir.
                    if (dto.CurrentUserRoleId != 1 && dto.CurrentUserRoleId != 2)
                    {
                        return new ServiceResultDto { IsSuccess = false, Message = "İlk randevu (Ön Görüşme) sadece Sekreter tarafından oluşturulabilir." };
                    }

                    // KURAL 2: İlk randevu haktan düşmez (SessionNumber = 0)
                    newSessionNumber = 0;
                }
                else
                {
                    // KURAL 3: Sonraki randevular 8 haktan düşülür.
                    // SessionNumber'ı 0'dan büyük olanları sayıyoruz.
                    int countedSessions = existingAppointments.Count(a => a.SessionNumber > 0);

                    if (countedSessions >= 8)
                    {
                        return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci 8 seanslık görüşme hakkını doldurmuştur." };
                    }

                    newSessionNumber = countedSessions + 1;
                }
                // ==========================================================================================

                // E. Terapist Çakışma Kontrolü
                var endDate = appointmentDateTime.AddMinutes(50);
                bool isTaken = await _context.Appointments.AnyAsync(x => x.TherapistId == dto.TherapistId && x.Status != AppointmentStatus.Cancelled && !x.IsDeleted && ((appointmentDateTime >= x.AppointmentDate && appointmentDateTime < x.EndDate) || (endDate > x.AppointmentDate && endDate <= x.EndDate)));
                if (isTaken) return new ServiceResultDto { IsSuccess = false, Message = "Seçilen saatte terapist dolu." };

                // F. Kayıt
                var appointment = new Appointment
                {
                    SessionId = dto.SessionId.Value,
                    TherapistId = dto.TherapistId.Value,
                    UserId = studentUser?.Id,
                    AppointmentDate = appointmentDateTime,
                    AppointmentHour = dto.AppointmentHour,
                    EndDate = endDate,
                    Status = AppointmentStatus.Planned,
                    AppointmentType = dto.AppointmentType ?? "Yüz Yüze",
                    LocationOrLink = dto.LocationOrLink ?? "Merkez Ofis",
                    CreatedAt = DateTime.Now,

                    // Hesapladığımız numara (0 veya 1..8)
                    SessionNumber = newSessionNumber,

                    IsDeleted = false,
                    CampusId = therapist.CampusId > 0 ? therapist.CampusId : 1
                };

                _context.Appointments.Add(appointment);
                session.AdvisorId = dto.TherapistId.Value;
                session.Status = "Devam Ediyor";
                await _context.SaveChangesAsync();

                string sEmail = studentUser?.Email; if (string.IsNullOrEmpty(sEmail)) sEmail = session.Student.Email;
                string tEmail = therapist.Email;
                _ = Task.Run(() => SendEmailSafe(sEmail, tEmail, session.Student, therapist, appointmentDateTime, dto));

                return new ServiceResultDto { IsSuccess = true, Message = "Randevu başarıyla oluşturuldu." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }

        // ========================================================================
        // 4. DURUM GÜNCELLEME
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

                if (apt.Status == AppointmentStatus.Cancelled || apt.Status == AppointmentStatus.NoShow)
                {
                    apt.CancellationReason = model.Reason;
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
                else if (apt.Status == AppointmentStatus.Completed)
                {
                    if (apt.Session != null)
                    {
                        apt.Session.TherapistNotes = model.TherapistNotes;
                        apt.Session.RiskLevel = model.RiskLevel;
                        if (!string.IsNullOrEmpty(model.ReferralDestination))
                        {
                            apt.Session.ReferralDestination = model.ReferralDestination;
                            apt.Session.Status = "Yönlendirildi";
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Durum güncellendi." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }

        // ... Diğer Metodlar ...
        public async Task<List<TherapistDashboardDto>> GetTherapistScheduleAsync(int therapistId)
        {
            var appointments = await _context.Appointments.AsNoTracking().Include(a => a.User).Include(a => a.Session).Where(a => a.TherapistId == therapistId && !a.IsDeleted).OrderBy(a => a.AppointmentDate).ToListAsync();
            return appointments.Select(a => new TherapistDashboardDto { Id = a.Id, Date = a.AppointmentDate.ToString("dd.MM.yyyy"), Time = a.AppointmentDate.ToString("HH:mm"), StudentName = a.User != null ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}" : "Bilinmeyen", StudentId = a.User?.UserName ?? "-", Type = a.AppointmentType, Status = a.Status.ToString(), Note = a.Session?.TherapistNotes ?? "", CurrentSessionCount = a.SessionNumber }).ToList();
        }

        public async Task<List<AppointmentDetailDto>> GetAllAppointmentsAsync()
        {
            var appointments = await _context.Appointments
               .AsNoTracking()
               .Include(a => a.User)
               .Include(a => a.Therapist)
               .Include(a => a.Session).ThenInclude(s => s.Student)
               .Where(a => a.Status != AppointmentStatus.Cancelled && !a.IsDeleted)
               .OrderByDescending(a => a.AppointmentDate)
               .ToListAsync();

            return appointments.Select(a => MapToDto(a)).ToList();
        }

        // --- TERAPİSTİN KENDİ RANDEVULARI (DÜZELTİLDİ) ---
        public async Task<List<TherapistAppointmentDto>> GetTherapistAppointmentsAsync(int therapistId)
        {
            var appointments = await _context.Appointments
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Session).ThenInclude(s => s.Student) // ÖĞRENCİ BİLGİSİNİ GARANTİYE AL
                .Where(a => a.TherapistId == therapistId)
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return appointments.Select(a => new TherapistAppointmentDto
            {
                Id = a.Id,

                // İSİM ALMA MANTIĞI: User yoksa Session.Student'tan al
                StudentName = GetStudentName(a),

                // ID: SessionId veya StudentId (string olarak)
                StudentId = a.SessionId.ToString(),

                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentHour ?? a.AppointmentDate.ToString("HH:mm"),
                Type = a.AppointmentType ?? "Genel",
                Status = a.Status.ToString(),
                Note = a.Description ?? "Not girilmemiş",
                CurrentSessionCount = a.SessionNumber
            }).ToList();
        }

        public async Task<ServiceResultDto> AddCustomHolidayAsync(AddHolidayDto dto)
        {
            try
            {
                if (dto.CurrentUserRoleId != 1 && dto.CurrentUserRoleId != 2) return new ServiceResultDto { IsSuccess = false, Message = "Yetkiniz yok." };
                DateTime holidayDate;
                if (!DateTime.TryParseExact(dto.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out holidayDate)) return new ServiceResultDto { IsSuccess = false, Message = "Geçersiz tarih formatı." };
                if (holidayDate < DateTime.Today) return new ServiceResultDto { IsSuccess = false, Message = "Geçmişe tatil eklenemez." };
                bool exists = await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == holidayDate);
                if (exists) return new ServiceResultDto { IsSuccess = false, Message = "Bu tarih zaten tatil." };
                var holiday = new UniversityCustomHoliday { HolidayDate = holidayDate, Description = dto.Description ?? "İdari İzin" };
                _context.UniversityCustomHolidays.Add(holiday);
                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Tatil eklendi." };
            }
            catch (Exception ex) { return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message }; }
        }

        public async Task<bool> IsHolidayAsync(DateTime date)
        {
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) return true;
            if (HolidaySystem.IsPublicHoliday(date, CountryCode.TR)) return true;
            return await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == date.Date);
        }

        private AppointmentDetailDto MapToDto(Appointment a)
        {
            return new AppointmentDetailDto
            {
                Id = a.Id,
                StudentName = GetStudentName(a),
                TherapistName = a.Therapist != null ? $"{a.Therapist.FirstName} {a.Therapist.LastName}" : "Bilinmeyen",
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentHour,
                Status = a.Status.ToString(),

                // TÜR ALANINA SEANS BİLGİSİNİ EKLEYELİM Kİ SEKRETER GÖRSÜN
                Type = a.SessionNumber == 0 ? "Ön Görüşme (Sekreter)" : $"Seans {a.SessionNumber} (Terapist)"
            };
        }
        // Şifreli ismi çözüp döndüren yardımcı metot
        private string GetStudentName(Appointment a)
        {
            if (a.User != null)
                return $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}";

            if (a.Session != null && a.Session.Student != null)
                return $"{CryptoHelper.Decrypt(a.Session.Student.FirstName)} {CryptoHelper.Decrypt(a.Session.Student.LastName)}";

            return "Bilinmeyen Danışan";
        }

        private async Task SendEmailSafe(string studentEmail, string therapistEmail, Student student, Therapist therapist, DateTime date, CreateAppointmentDto dto)
        {
            try
            {
                string tName = therapist != null ? $"{therapist.FirstName} {therapist.LastName}" : "Uzman";
                string sName = $"{student.FirstName} {student.LastName}";
                string dateStr = date.ToString("dd.MM.yyyy");
                string timeStr = dto.AppointmentHour;
                string type = dto.AppointmentType ?? "Genel";
                string loc = dto.LocationOrLink ?? "";

                // 1. Öğrenciye Gönder (Eski metot)
                if (!string.IsNullOrEmpty(studentEmail))
                {
                    _mailHelper.SendAppointmentEmail(studentEmail, sName, tName, dateStr, timeStr, type, loc);
                }

                // 2. Terapiste Gönder (YENİ ÖZEL METOT)
                if (!string.IsNullOrEmpty(therapistEmail))
                {
                    _mailHelper.SendTherapistNotification(therapistEmail, tName, sName, dateStr, timeStr, type, loc);
                }
            }
            catch (Exception ex) { Console.WriteLine("Mail Hatası: " + ex.Message); }
        }
    }
}