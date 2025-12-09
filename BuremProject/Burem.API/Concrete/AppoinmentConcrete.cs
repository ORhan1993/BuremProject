using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
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
        /// <summary>
        /// Seçilen tarih ve terapist için uygun saat dilimlerini hesaplar.
        /// Terapistin aktifliğini, resmi tatilleri ve öğle arasını (12:00-13:00) dikkate alır.
        /// </summary>
        /// <returns>Müsait saatlerin listesi (Örn: 9, 10, 14)</returns>
        public async Task<List<int>> GetAvailableHoursAsync(int therapistId, DateTime date)
        {
            // A. Terapist Kontrolü: Terapist sistemde var mı ve aktif olarak çalışıyor mu?
            var therapist = await _context.Therapists.FindAsync(therapistId);
            if (therapist == null || !therapist.IsActive)
            {
                return new List<int>(); // Terapist hizmet vermiyorsa saat listesi boş döner.
            }

            // B. Tatil Kontrolü: Seçilen gün tatil ise işlem yapmaya gerek yok.
            if (await IsHolidayAsync(date))
            {
                return new List<int>();
            }

            // C. Doluluk Kontrolü: O gün ve o terapist için alınmış (iptal edilmemiş) randevuları çek.
            var bookedHours = await _context.Appointments
                .Where(x => x.TherapistId == therapistId &&
                            x.AppointmentDate.Date == date.Date &&
                            x.Status != AppointmentStatus.Cancelled)
                .Select(x => x.AppointmentDate.Hour)
                .ToListAsync();

            // D. Saat Hesaplama: 09:00 - 16:00 arası döngü kur.
            var availableHours = new List<int>();
            for (int i = 9; i <= 16; i++)
            {
                // KURAL: Saat 12:00 - 13:00 arası öğle tatilidir. Listeye eklenmez.
                if (i == 12) continue;

                // Eğer saat veritabanında dolu değilse, müsait listesine ekle.
                if (!bookedHours.Contains(i))
                {
                    availableHours.Add(i);
                }
            }
            return availableHours;
        }

        // ========================================================================
        // 2. MÜSAİT TERAPİSTLERİ GETİRME
        // ========================================================================
        /// <summary>
        /// Sistemdeki aktif terapistleri; uzmanlık türü, kampüs bilgisi ve mevcut iş yükü ile birlikte listeler.
        /// </summary>
        /// <param name="category">Filtreleme yapılacak uzmanlık türü (Örn: 'Deneyimli Uzman')</param>
        public async Task<List<TherapistAvailabilityDto>> GetAvailableTherapistsAsync(string category)
        {
            // Veritabanından Terapistleri çekerken, ilişkili oldukları TİP ve KAMPÜS tablolarını da (JOIN) getiriyoruz.
            var query = _context.Therapists
                .Include(t => t.TherapistType) // 'Deneyimli', 'Gönüllü' vb. verisi için
                .Include(t => t.Campus)        // 'Kuzey Kampüs' vb. verisi için
                .Where(t => t.IsActive);       // Sadece aktif terapistler listelenir.

            // Frontend'den kategori filtresi gelmişse sorguya ekle.
            if (!string.IsNullOrEmpty(category) && category != "Tümü")
            {
                query = query.Where(t => t.TherapistType.Name == category);
            }

            var activeTherapists = await query.OrderBy(t => t.FirstName).ToListAsync();
            var result = new List<TherapistAvailabilityDto>();

            foreach (var t in activeTherapists)
            {
                // Terapistin gelecekteki aktif randevu sayısını (İş Yükünü) hesapla.
                int currentLoad = await _context.Appointments
                    .CountAsync(a => a.TherapistId == t.Id
                                  && a.AppointmentDate >= DateTime.Now
                                  && a.Status != AppointmentStatus.Cancelled);

                // DTO Mapping: Veritabanı nesnesini Frontend'in anlayacağı formata çevir.
                result.Add(new TherapistAvailabilityDto
                {
                    Id = t.Id,
                    Name = $"{t.FirstName} {t.LastName}",
                    // İlişkili tablo boşsa varsayılan değer ata (Hata almamak için).
                    Category = t.TherapistType != null ? t.TherapistType.Name : "Genel Uzman",
                    Campus = t.Campus != null ? t.Campus.Name : "Merkez Kampüs",
                    CurrentLoad = currentLoad,
                    // Basit Algoritma: Günde ortalama 5 slot kapasitesi varsayarak doluluk hesapla.
                    DailySlots = Math.Max(0, 5 - (currentLoad % 5)),
                    WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
                });
            }

            return result;
        }

        // ========================================================================
        // 3. RANDEVU OLUŞTURMA (MERKEZİ İŞ MANTIĞI)
        // ========================================================================
        /// <summary>
        /// Yeni bir randevu kaydı oluşturur. 
        /// Max 8 randevu sınırı, rol yetkileri, tatil kontrolü, öğle arası ve çakışma kontrollerini yapar.
        /// </summary>
        public async Task<ServiceResultDto> CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            try
            {
                // --- A. GİRİŞ VALIDASYONLARI ---
                if (dto.SessionId == null || dto.SessionId == 0)
                    return new ServiceResultDto { IsSuccess = false, Message = "Başvuru ID bulunamadı." };
                if (dto.TherapistId == null || dto.TherapistId == 0)
                    return new ServiceResultDto { IsSuccess = false, Message = "Terapist seçilmedi." };

                var therapist = await _context.Therapists.FindAsync(dto.TherapistId);
                if (therapist == null || !therapist.IsActive)
                    return new ServiceResultDto { IsSuccess = false, Message = "Seçilen terapist aktif değil veya bulunamadı." };

                // --- B. TARİH VE SAAT İŞLEMLERİ ---
                DateTime appointmentDateTime;
                try
                {
                    // "2023-10-25" ve "14:00" stringlerini DateTime objesine çevir.
                    var datePart = DateTime.ParseExact(dto.AppointmentDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
                    var timePart = TimeSpan.Parse(dto.AppointmentHour);
                    appointmentDateTime = datePart.Add(timePart);
                }
                catch
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Tarih formatı geçersiz." };
                }

                if (appointmentDateTime < DateTime.Now)
                    return new ServiceResultDto { IsSuccess = false, Message = "Geçmişe dönük randevu verilemez." };

                // KURAL: Öğle Arası (Backend tarafında son güvenlik kontrolü)
                if (appointmentDateTime.Hour == 12)
                    return new ServiceResultDto { IsSuccess = false, Message = "12:00 - 13:00 arası öğle tatilidir, randevu verilemez." };

                // KURAL: Tatil Kontrolü
                if (await IsHolidayAsync(appointmentDateTime))
                    return new ServiceResultDto { IsSuccess = false, Message = "Seçilen tarih tatil günüdür." };

                // --- C. İŞ MANTIĞI VE KISITLAMALAR ---

                // İlgili Başvuruyu ve Öğrenci Kullanıcısını bul.
                var session = await _context.Sessions.Include(s => s.Student).FirstOrDefaultAsync(s => s.Id == dto.SessionId);
                if (session == null) return new ServiceResultDto { IsSuccess = false, Message = "Başvuru bulunamadı." };

                var studentUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == session.Student.StudentNo && u.UserType == 3 && u.IsDeleted == 0);
                if (studentUser == null) return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci kullanıcısı aktif değil." };

                // KURAL: Bir öğrenci aynı başvuru için en fazla 8 randevu alabilir.
                int appointmentCount = await _context.Appointments
                    .CountAsync(a => a.UserId == studentUser.Id && a.SessionId == dto.SessionId && a.Status != AppointmentStatus.Cancelled);

                if (appointmentCount >= 8)
                    return new ServiceResultDto { IsSuccess = false, Message = "Öğrenci 8 seans sınırını doldurmuştur." };

                // KURAL: Rol Yetkisi (İlk randevu Sekreter, sonrakiler Terapist)
                if (appointmentCount == 0 && dto.CurrentUserRoleId != 2)
                    return new ServiceResultDto { IsSuccess = false, Message = "İlk randevuyu sadece Sekreterlik birimi oluşturabilir." };

                if (appointmentCount > 0 && dto.CurrentUserRoleId != 4)
                    return new ServiceResultDto { IsSuccess = false, Message = "Devam eden seansların randevusunu sadece Terapist verebilir." };

                // KURAL: Çakışma (Concurrency) Kontrolü. O saatte terapist dolu mu?
                var endDate = appointmentDateTime.AddMinutes(50); // Seans süresi 50 dk varsayıldı.
                bool isTaken = await _context.Appointments.AnyAsync(x =>
                    x.TherapistId == dto.TherapistId &&
                    x.Status != AppointmentStatus.Cancelled &&
                    ((appointmentDateTime >= x.AppointmentDate && appointmentDateTime < x.EndDate) ||
                     (endDate > x.AppointmentDate && endDate <= x.EndDate)));

                if (isTaken)
                    return new ServiceResultDto { IsSuccess = false, Message = "Seçilen saatte terapistin başka bir randevusu mevcut." };

                // --- D. KAYIT VE GÜNCELLEME ---
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
                    CreatedAt = DateTime.Now
                };

                _context.Appointments.Add(appointment);

                // Başvuru (Session) tablosundaki danışman bilgisini ve durumu güncelle.
                session.AdvisorId = dto.TherapistId.Value;
                session.Status = "Devam Ediyor";

                await _context.SaveChangesAsync();

                // --- E. MAIL GÖNDERİMİ ---
                // İşlem süresini uzatmamak için mail gönderimini arka planda (Task.Run) yapıyoruz.
                _ = Task.Run(() => SendEmailSafe(session.Student.Email, session.Student, therapist, appointmentDateTime, dto));

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
        /// <summary>
        /// Randevunun durumunu (İptal, Tamamlandı, Gelmedi) günceller.
        /// Tamamlandı durumunda terapist notlarını kaydeder, iptal durumunda mazereti işler.
        /// Duruma göre öğrenciye mail atar.
        /// </summary>
        public async Task<ServiceResultDto> UpdateStatusAsync(UpdateAppointmentStatusDto model)
        {
            try
            {
                var apt = await _context.Appointments
                            .Include(a => a.Session)
                            .Include(a => a.User)       // Öğrenci
                            .Include(a => a.Therapist)  // Terapist
                            .FirstOrDefaultAsync(a => a.Id == model.AppointmentId);

                if (apt == null) return new ServiceResultDto { IsSuccess = false, Message = "Randevu bulunamadı." };

                apt.Status = (AppointmentStatus)model.Status;

                // --- DURUM 1: İPTAL veya GELMEDİ ---
                if (apt.Status == AppointmentStatus.Cancelled || apt.Status == AppointmentStatus.NoShow)
                {
                    apt.CancellationReason = model.Reason; // İptal sebebini kaydet

                    if (apt.User != null && !string.IsNullOrEmpty(apt.User.UserName))
                    {
                        // İptal Bilgilendirme Maili
                        try
                        {
                            _mailHelper.SendCancellationEmail(
                               apt.User.UserName,
                               $"{CryptoHelper.Decrypt(apt.User.FirstName)} {CryptoHelper.Decrypt(apt.User.LastName)}",
                               apt.AppointmentDate.ToString("dd.MM.yyyy"),
                               apt.AppointmentDate.ToString("HH:mm"),
                               model.Reason ?? "Belirtilmedi");
                        }
                        catch (Exception e) { Console.WriteLine("İptal maili hatası: " + e.Message); }
                    }
                }
                // --- DURUM 2: TAMAMLANDI ---
                else if (apt.Status == AppointmentStatus.Completed)
                {
                    // Seans notlarını ve risk seviyesini Session tablosuna işle (Öğrenci bunları göremez)
                    if (apt.Session != null)
                    {
                        apt.Session.TherapistNotes = model.TherapistNotes;
                        apt.Session.RiskLevel = model.RiskLevel;

                        // Eğer hastane vb. bir yere yönlendirme yapıldıysa durumu değiştir.
                        if (!string.IsNullOrEmpty(model.ReferralDestination))
                        {
                            apt.Session.ReferralDestination = model.ReferralDestination;
                            apt.Session.Status = "Yönlendirildi";
                        }
                    }

                    // Değerlendirme Formu Maili
                    if (apt.User != null && !string.IsNullOrEmpty(apt.User.UserName))
                    {
                        try
                        {
                            _mailHelper.SendEvaluationEmail(
                                apt.User.UserName,
                                $"{CryptoHelper.Decrypt(apt.User.FirstName)} {CryptoHelper.Decrypt(apt.User.LastName)}",
                                $"{apt.Therapist.FirstName} {apt.Therapist.LastName}",
                                apt.AppointmentDate.ToString("dd.MM.yyyy"));
                        }
                        catch (Exception e) { Console.WriteLine("Değerlendirme maili hatası: " + e.Message); }
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

        // ========================================================================
        // 5. RAPORLAMA VE LİSTELEME
        // ========================================================================

        /// <summary>
        /// Belirli bir terapistin randevu takvimini (Dashboard görünümü için) getirir.
        /// </summary>
        public async Task<List<TherapistDashboardDto>> GetTherapistScheduleAsync(int therapistId)
        {
            var appointments = await _context.Appointments
                .Include(a => a.User)
                .Include(a => a.Session)
                .Where(a => a.TherapistId == therapistId)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return appointments.Select(a => new TherapistDashboardDto
            {
                Id = a.Id,
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentDate.ToString("HH:mm"),
                // Öğrenci ismi şifreli varsayımıyla Decrypt edilir.
                StudentName = a.User != null
                    ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}"
                    : "Bilinmeyen Danışan",
                StudentId = a.User?.UserName ?? "-",
                Type = a.AppointmentType,
                Status = a.Status == AppointmentStatus.Completed ? "completed" :
                         a.Status == AppointmentStatus.Cancelled ? "cancelled" : "active",
                Note = a.Session?.TherapistNotes ?? "",
                CurrentSessionCount = a.Session?.SessionNumber ?? 1
            }).ToList();
        }

        /// <summary>
        /// Sistemdeki tüm aktif randevuları (Admin paneli için) listeler.
        /// </summary>
        public async Task<List<AppointmentDetailDto>> GetAllAppointmentsAsync()
        {
            var appointments = await _context.Appointments
               .Include(a => a.User)
               .Include(a => a.Therapist)
               .Include(a => a.Session)
               .Where(a => a.Status != AppointmentStatus.Cancelled)
               .OrderByDescending(a => a.AppointmentDate)
               .ToListAsync();

            return appointments.Select(a => new AppointmentDetailDto
            {
                Id = a.Id,
                StudentName = a.User != null ? $"{CryptoHelper.Decrypt(a.User.FirstName)} {CryptoHelper.Decrypt(a.User.LastName)}" : "Bilinmeyen",
                TherapistName = a.Therapist != null ? $"{a.Therapist.FirstName} {a.Therapist.LastName}" : "Bilinmeyen",
                Date = a.AppointmentDate.ToString("dd.MM.yyyy"),
                Time = a.AppointmentHour,
                Status = a.Status.ToString(),
                Type = a.AppointmentType
            }).ToList();
        }

        // ========================================================================
        // PRIVATE HELPERS (YARDIMCI METOTLAR)
        // ========================================================================

        /// <summary>
        /// Verilen tarihin randevuya kapalı olup olmadığını kontrol eden hibrit metot.
        /// 1. Hafta sonu mu?
        /// 2. Nager.Date ile resmi tatil mi?
        /// 3. Veritabanında (UniversityCustomHolidays) özel tatil mi?
        /// </summary>
        public async Task<bool> IsHolidayAsync(DateTime date)
        {
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) return true;
            if (HolidaySystem.IsPublicHoliday(date, CountryCode.TR)) return true;
            return await _context.UniversityCustomHolidays.AnyAsync(h => h.HolidayDate == date.Date);
        }

        /// <summary>
        /// Mail gönderim işlemini güvenli bir şekilde yapar.
        /// Hata alsa bile uygulamanın (randevu kaydının) çökmesini engeller (Try-Catch).
        /// </summary>
        private async Task SendEmailSafe(string email, Student student, Therapist therapist, DateTime date, CreateAppointmentDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(email)) return;
                string tName = therapist != null ? $"{therapist.FirstName} {therapist.LastName}" : "Uzman";

                _mailHelper.SendAppointmentEmail(
                    email, $"{student.FirstName} {student.LastName}", tName,
                    date.ToString("dd.MM.yyyy"), dto.AppointmentHour,
                    dto.AppointmentType ?? "Genel", dto.LocationOrLink ?? ""
                );
            }
            catch (Exception ex)
            {
                // Hata sadece loglanır, kullanıcıya hata döndürülmez.
                Console.WriteLine("Mail Hatası: " + ex.Message);
            }
        }

        // ========================================================================
        // 5. ÖZEL TATİL EKLEME (ADMİN VE SEKRETER YETKİSİ)
        // ========================================================================
        /// <summary>
        /// Üniversiteye özel tatil ekler (Kar tatili vb.).
        /// Sadece Admin (1) ve Sekreter (2) yetkisine sahiptir.
        /// Eklenen tatil, randevu sistemini o gün için otomatik kapatır.
        /// </summary>
        public async Task<ServiceResultDto> AddCustomHolidayAsync(AddHolidayDto dto)
        {
            try
            {
                // 1. YETKİ KONTROLÜ
                // Rol ID'leri: 1=Admin, 2=Sekreter. Diğerleri (3=Öğrenci, 4=Terapist) ekleyemez.
                if (dto.CurrentUserRoleId != 1 && dto.CurrentUserRoleId != 2)
                {
                    return new ServiceResultDto
                    {
                        IsSuccess = false,
                        Message = "Bu işlemi yapmaya yetkiniz yok. Sadece Admin ve Sekreter tatil ekleyebilir."
                    };
                }

                // 2. TARİH FORMATI
                DateTime holidayDate;
                try
                {
                    holidayDate = DateTime.ParseExact(dto.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
                }
                catch
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Geçersiz tarih formatı. (Beklenen: yyyy-MM-dd)" };
                }

                if (holidayDate < DateTime.Today)
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Geçmiş bir tarihe tatil eklenemez." };
                }

                // 3. MÜKERRER KAYIT KONTROLÜ
                bool exists = await _context.UniversityCustomHolidays
                    .AnyAsync(h => h.HolidayDate == holidayDate);

                if (exists)
                {
                    return new ServiceResultDto { IsSuccess = false, Message = "Bu tarih için zaten bir özel tatil tanımlanmış." };
                }

                // 4. KAYIT İŞLEMİ
                var holiday = new UniversityCustomHoliday
                {
                    HolidayDate = holidayDate,
                    Description = dto.Description ?? "İdari İzin"
                };

                _context.UniversityCustomHolidays.Add(holiday);
                await _context.SaveChangesAsync();

                return new ServiceResultDto { IsSuccess = true, Message = "Özel tatil başarıyla eklendi. O gün için randevu sistemi kapatıldı." };
            }
            catch (Exception ex)
            {
                return new ServiceResultDto { IsSuccess = false, Message = "Hata: " + ex.Message };
            }
        }
    }
}