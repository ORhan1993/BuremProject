using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data.Enums;   // Enum'lar burada
using Burem.Data.Models;  // Entity'ler burada
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
        // 1. MÜSAİT TERAPİSTLERİ GETİRME
        // ========================================================================
        public async Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category)
        {
            // Veritabanından Terapist rolündeki (UserType == 4) ve silinmemiş kullanıcıları çek
            var encryptedTherapists = await _context.Users
                                            .Where(u => u.UserType == 4 && u.IsDeleted == 0)
                                            .ToListAsync();

            var result = new List<TherapistAvailabilityDto>();

            foreach (var user in encryptedTherapists)
            {
                // Şifreli İsimleri Çöz (Decrypt)
                string decryptedName = $"{CryptoHelper.Decrypt(user.FirstName)} {CryptoHelper.Decrypt(user.LastName)}";

                // Terapistin gelecekteki aktif randevu yükünü hesapla
                int currentLoad = await _context.Appointments
                    .CountAsync(a => a.TherapistId == user.Id // User.cs'de Id (int) olarak tanımlı
                                     && a.AppointmentDate >= DateTime.Now
                                     && a.Status != AppointmentStatus.Cancelled);

                result.Add(new TherapistAvailabilityDto
                {
                    Id = user.Id,
                    Name = decryptedName,

                    // --- DÜZELTİLEN SATIR ---
                    // Enum null ise "Genel", değilse Enum'ın string değeri (örn: "Experienced")
                    Category = user.TherapistCategory?.ToString() ?? "Genel",

                    Campus = "Kuzey",
                    CurrentLoad = currentLoad,
                    // Basit Slot Hesabı: Günde max 5 görüşme varsayımı
                    DailySlots = Math.Max(0, 5 - (currentLoad % 5)),
                    WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
                });
            }

            return result;
        }

        // ========================================================================
        // 2. RANDEVU OLUŞTURMA VE MAIL GÖNDERME
        // ========================================================================
        public async Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            try
            {
                // 1. ZORUNLU ALAN KONTROLLERİ (Manuel Validation)
                if (dto.SessionId == null || dto.SessionId == 0)
                    return new ServiceResultDto { IsSuccess = false, Message = "Hata: Başvuru ID (SessionId) alınamadı." };

                if (dto.TherapistId == null || dto.TherapistId == 0)
                    return new ServiceResultDto { IsSuccess = false, Message = "Hata: Terapist seçilmedi." };

                if (string.IsNullOrEmpty(dto.AppointmentDate) || string.IsNullOrEmpty(dto.AppointmentHour))
                    return new ServiceResultDto { IsSuccess = false, Message = "Hata: Tarih ve Saat seçimi zorunludur." };

                // 2. BAŞVURU (SESSION) KONTROLÜ
                var session = await _context.Sessions
                                            .Include(s => s.Student)
                                            .FirstOrDefaultAsync(s => s.Id == dto.SessionId.Value);

                if (session == null)
                    return new ServiceResultDto { IsSuccess = false, Message = "Başvuru kaydı veritabanında bulunamadı." };

                // 3. ÖĞRENCİ KULLANICISINI BULMA
                var studentUser = await _context.Users
                                                .FirstOrDefaultAsync(u => u.UserName == session.Student.StudentNo
                                                                       && u.UserType == 3
                                                                       && u.IsDeleted == 0);

                if (studentUser == null)
                    return new ServiceResultDto { IsSuccess = false, Message = $"Öğrenci kullanıcısı (No: {session.Student.StudentNo}) sistemde aktif değil." };

                int realUserId = studentUser.Id;

                // 4. TARİH DÖNÜŞTÜRME (Format hatasını burada yakalıyoruz)
                DateTime appointmentDateTime;
                try
                {
                    // Frontend 'YYYY-MM-DD' gönderiyor. ParseExact ile net dönüşüm yapıyoruz.
                    var datePart = DateTime.ParseExact(dto.AppointmentDate, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
                    var timePart = TimeSpan.Parse(dto.AppointmentHour);
                    appointmentDateTime = datePart.Add(timePart);
                }
                catch
                {
                    return new ServiceResultDto { IsSuccess = false, Message = $"Tarih formatı sunucu tarafından anlaşılamadı. (Gelen Veri: {dto.AppointmentDate} {dto.AppointmentHour})" };
                }

                var endDate = appointmentDateTime.AddMinutes(50);

                // 5. ÇAKIŞMA KONTROLÜ
                var hasConflict = await _context.Appointments.AnyAsync(x =>
                    x.TherapistId == dto.TherapistId.Value &&
                    x.Status != AppointmentStatus.Cancelled &&
                    (
                        (appointmentDateTime >= x.AppointmentDate && appointmentDateTime < x.EndDate) ||
                        (endDate > x.AppointmentDate && endDate <= x.EndDate) ||
                        (appointmentDateTime <= x.AppointmentDate && endDate >= x.EndDate)
                    )
                );

                if (hasConflict)
                    return new ServiceResultDto { IsSuccess = false, Message = "Seçilen saatte terapistin başka bir randevusu mevcut." };

                // 6. KOTA KONTROLÜ
                int count = await _context.Appointments
                    .CountAsync(a => a.UserId == realUserId && a.SessionId == dto.SessionId.Value && a.Status != AppointmentStatus.Cancelled);

                if (count >= 8)
                    return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci maksimum görüşme sayısına (8) ulaşmıştır." };

                // 7. KAYIT OLUŞTURMA
                var appointment = new Appointment
                {
                    SessionId = dto.SessionId.Value,
                    TherapistId = dto.TherapistId.Value,
                    UserId = realUserId,
                    AppointmentDate = appointmentDateTime,
                    AppointmentHour = dto.AppointmentHour,
                    EndDate = endDate,
                    Status = AppointmentStatus.Planned,
                    AppointmentType = dto.AppointmentType ?? "Yüz Yüze",
                    LocationOrLink = dto.LocationOrLink ?? "Belirtilmedi",
                    CreatedAt = DateTime.Now
                };

                _context.Appointments.Add(appointment);

                // 8. SESSION GÜNCELLEME
                session.AdvisorId = dto.TherapistId.Value;
                session.Status = "Devam Ediyor";

                // 9. E-POSTA GÖNDERİMİ (Hata alırsa işlemi durdurmasın, sadece loglasın)
                try
                {
                    if (!string.IsNullOrEmpty(session.Student.Email))
                    {
                        var therapist = await _context.Users.FindAsync(dto.TherapistId.Value);
                        string tName = therapist != null ?
                            $"{CryptoHelper.Decrypt(therapist.FirstName)} {CryptoHelper.Decrypt(therapist.LastName)}" : "Uzman";

                        _mailHelper.SendAppointmentEmail(
                            session.Student.Email,
                            $"{session.Student.FirstName} {session.Student.LastName}",
                            tName,
                            appointmentDateTime.ToString("dd.MM.yyyy"),
                            dto.AppointmentHour,
                            dto.AppointmentType ?? "Genel",
                            dto.LocationOrLink ?? ""
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Mail gönderilemedi: " + ex.Message);
                }

                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Randevu başarıyla oluşturuldu." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Sunucu Hatası: " + ex.Message };
            }
        }

        // ========================================================================
        // 3. DURUM GÜNCELLEME, NOT KAYDETME VE MAIL GÖNDERME (TAM VERSİYON)
        // ========================================================================
        public async Task<ServiceResultDto> UpdateStatusAsync(UpdateAppointmentStatusDto model)
        {
            try
            {
                // 1. Randevuyu ve İlişkili Verileri (Öğrenci, Terapist, Session) Çek
                var apt = await _context.Appointments
                                        .Include(a => a.Session)
                                        .Include(a => a.User) // Öğrenci (Mail için)
                                        .Include(a => a.Therapist) // Terapist Adı (Mail için)
                                        .FirstOrDefaultAsync(a => a.Id == model.AppointmentId);

                if (apt == null)
                    return new ServiceResultDto { IsSuccess = false, Message = "Randevu bulunamadı." };

                // Eski durumu sakla (Değişiklik kontrolü için)
                var oldStatus = apt.Status;

                // Yeni durumu ata
                apt.Status = (AppointmentStatus)model.Status;

                // --- SENARYO A: İPTAL VEYA GELMEDİ (NO-SHOW) ---
                if (apt.Status == AppointmentStatus.Cancelled || apt.Status == AppointmentStatus.NoShow)
                {
                    
                    apt.CancellationReason = model.Reason;

                    // Öğrenciye İptal Bilgilendirme Maili Gönder
                    if (apt.User != null && !string.IsNullOrEmpty(apt.User.UserName)) // UserName genelde email tutar veya Email alanı vardır
                    {
                        // Not: User modelinde Email alanı yoksa UserName kullanılıyor olabilir, kontrol edin.
                        

                        string studentEmail = apt.User.UserName; // veya apt.User.Email
                        if (studentEmail.Contains("@"))
                        {
                            try
                            {
                                _mailHelper.SendCancellationEmail(
                                    studentEmail,
                                    $"{apt.User.FirstName} {apt.User.LastName}",
                                    apt.AppointmentDate.ToString("dd.MM.yyyy"),
                                    apt.AppointmentDate.ToString("HH:mm"),
                                    model.Reason ?? "Belirtilmedi"
                                );
                            }
                            catch (Exception ex) { Console.WriteLine("İptal maili hatası: " + ex.Message); }
                        }
                    }
                }

                // --- SENARYO B: TAMAMLANDI (COMPLETED) ---
                else if (apt.Status == AppointmentStatus.Completed)
                {
                    
                    if (apt.Session != null)
                    {
                        // Bu notlar gizlidir, öğrenci göremez.
                        apt.Session.TherapistNotes = model.TherapistNotes;
                        apt.Session.RiskLevel = model.RiskLevel;
                        apt.Session.ReferralDestination = model.ReferralDestination;

                        // Eğer "Yönlendirme" yapıldıysa (Örn: Hastane), Session durumunu da güncelle
                        if (!string.IsNullOrEmpty(model.ReferralDestination))
                        {
                            apt.Session.Status = "Yönlendirildi";
                        }
                        else
                        {
                            apt.Session.Status = "Devam Ediyor"; // veya mantığınıza göre başka bir statü
                        }
                    }

                    
                    // Analiz: Görüşme bittikten sonra değerlendirme formu iletilir.
                    if (apt.User != null)
                    {
                        string studentEmail = apt.User.UserName;
                        string therapistName = $"{CryptoHelper.Decrypt(apt.Therapist.FirstName)} {CryptoHelper.Decrypt(apt.Therapist.LastName)}";

                        if (studentEmail.Contains("@"))
                        {
                            try
                            {
                                _mailHelper.SendEvaluationEmail(
                                    studentEmail,
                                    $"{apt.User.FirstName} {apt.User.LastName}",
                                    therapistName,
                                    apt.AppointmentDate.ToString("dd.MM.yyyy")
                                );
                            }
                            catch (Exception ex) { Console.WriteLine("Değerlendirme maili hatası: " + ex.Message); }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Randevu durumu güncellendi, notlar kaydedildi ve ilgili e-postalar gönderildi." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }


        // TERAPİST TAKVİMİ
        public async Task<List<TherapistDashboardDto>> GetTherapistScheduleAsync(int therapistId)
        {
            var appointments = await _context.Appointments
                .Include(a => a.User)     // Öğrenci (User tablosundan)
                .Include(a => a.Session)  // Seans detayı (Kaçıncı seans bilgisi için)
                .Where(a => a.TherapistId == therapistId)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return appointments.Select(a => new TherapistDashboardDto
            {
                Id = a.Id,
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentDate.ToString("HH:mm"),

                // Öğrenci Adı (Şifreli ise Decrypt edin)
                StudentName = a.User != null
                    ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}"
                    : "Bilinmeyen Danışan",

                StudentId = a.User?.UserName ?? "-",
                Type = a.AppointmentType,

                // Frontend Badge durumu için mapping
                Status = a.Status == AppointmentStatus.Completed ? "completed" :
                         a.Status == AppointmentStatus.Cancelled ? "cancelled" : "active",

                Note = a.Session?.TherapistNotes ?? "", // Önceki notlar varsa
                CurrentSessionCount = a.Session?.SessionNumber ?? 1
            }).ToList();
        }

        // Bu metodu sınıfın içine ekleyin
        public async Task<List<AppointmentDetailDto>> GetAllAppointmentsAsync()
        {
            var appointments = await _context.Appointments
                .Include(a => a.User)      // Öğrenci
                .Include(a => a.Therapist) // Terapist
                .Include(a => a.Session)
                .Where(a => a.Status != AppointmentStatus.Cancelled)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            return appointments.Select(a => new AppointmentDetailDto
            {
                Id = a.Id,
                StudentName = a.User != null ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}" : "Bilinmeyen",
                TherapistName = a.Therapist != null ? $"{CryptoHelper.Decrypt(a.Therapist.FirstName)} {CryptoHelper.Decrypt(a.Therapist.LastName)}" : "Bilinmeyen",
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentHour, // Veritabanında ayrı tutuyorsanız
                Status = a.Status.ToString(),
                Type = a.AppointmentType
            }).ToList();
        }
    }
}