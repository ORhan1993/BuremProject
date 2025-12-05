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
                // Öğrencinin (User) bu dönemdeki tamamlanmış veya planlanmış randevu sayısını kontrol et
                int studentAppointmentCount = await _context.Appointments
                    .CountAsync(a => a.UserId == dto.UserId
                                  && a.Status != AppointmentStatus.Cancelled
                                  && a.SessionId == dto.SessionId); // Aynı başvuru dönemi içindeki sayım

                if (studentAppointmentCount >= 8)
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Bu öğrenci için maksimum görüşme sayısına (8) ulaşılmıştır." };
                }

                // A. Tarih Formatlama
                string dateTimeString = $"{dto.AppointmentDate} {dto.AppointmentHour}";

                if (!DateTime.TryParseExact(dateTimeString, "dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime appointmentDate))
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Tarih formatı hatalı. (Beklenen: dd.MM.yyyy HH:mm)" };
                }

                // Varsayılan seans süresi 50 dk
                var endDate = appointmentDate.AddMinutes(50);

                // B. ÇAKIŞMA KONTROLÜ (Conflict Check)
                var hasConflict = await _context.Appointments.AnyAsync(x =>
                    x.TherapistId == dto.TherapistId &&
                    x.Status != AppointmentStatus.Cancelled &&
                    (
                        (appointmentDate >= x.AppointmentDate && appointmentDate < x.EndDate) || // Başlangıç çakışması
                        (endDate > x.AppointmentDate && endDate <= x.EndDate) || // Bitiş çakışması
                        (appointmentDate <= x.AppointmentDate && endDate >= x.EndDate) // Kapsama
                    )
                );

                if (hasConflict)
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Seçilen saat aralığında terapistin başka bir randevusu mevcut!" };
                }

                // C. Entity Oluşturma ve Kaydetme
                var appointment = new Appointment
                {
                    SessionId = dto.SessionId,
                    TherapistId = dto.TherapistId,
                    UserId = dto.UserId,
                    AppointmentDate = appointmentDate,
                    EndDate = endDate,
                    Status = AppointmentStatus.Planned,
                    AppointmentType = dto.AppointmentType,
                    LocationOrLink = dto.LocationOrLink,
                    CreatedAt = DateTime.Now
                };

                _context.Appointments.Add(appointment);

                // D. Session (Başvuru) Tablosunu Güncelle (Danışmanı ata)
                var session = await _context.Sessions
                                            .Include(s => s.Student)
                                            .FirstOrDefaultAsync(s => s.Id == dto.SessionId); // Session.Id

                if (session != null)
                {
                    session.AdvisorId = dto.TherapistId; // Danışmanı güncelle

                    // --- E-POSTA GÖNDERİMİ ---
                    if (session.Student != null && !string.IsNullOrEmpty(session.Student.Email))
                    {
                        var therapist = await _context.Users.FindAsync(dto.TherapistId);
                        string therapistName = "BÜREM Uzmanı";
                        if (therapist != null)
                        {
                            therapistName = $"{CryptoHelper.Decrypt(therapist.FirstName)} {CryptoHelper.Decrypt(therapist.LastName)}";
                        }

                        try
                        {
                            _mailHelper.SendAppointmentEmail(
                                session.Student.Email,
                                $"{session.Student.FirstName} {session.Student.LastName}",
                                therapistName,
                                dto.AppointmentDate.Date.ToString(),
                                dto.AppointmentHour,
                                dto.AppointmentType,
                                dto.LocationOrLink
                            );
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Mail gönderilemedi: {ex.Message}");
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return new ServiceResultDto { IsSuccess = true, Message = "Randevu başarıyla oluşturuldu ve öğrenciye e-posta gönderildi." };
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
    }
}