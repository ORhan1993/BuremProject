using Burem.API.DTOs;
using Burem.API.Helpers; 
using Burem.Data.Models;
using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

[Route("api/[controller]")]
[ApiController]
public class AppointmentsController : ControllerBase
{
    private readonly BuremDbContext _context;
    private readonly MailHelper _mailHelper;

    public AppointmentsController(BuremDbContext context, IConfiguration config)
    {
        _context = context;
        _mailHelper = new MailHelper(config);
    }

    // 1. Müsait Terapistleri Getir
    [HttpGet("AvailableTherapists")]
    public async Task<IActionResult> GetAvailableTherapists(string category)
    {
        // 1. Veritabanından tüm aktif terapistleri çek (Şifreli oldukları için SQL'de isme göre filtreleyemeyiz)
        var encryptedTherapists = await _context.Users
                                        .Where(u => u.UserType == 4 && u.IsDeleted == 0)
                                        .ToListAsync();

        var result = new List<TherapistAvailabilityDto>();

        foreach (var user in encryptedTherapists)
        {
            // 2. RAM üzerinde şifreleri çöz
            string decryptedName = $"{CryptoHelper.Decrypt(user.FirstName)} {CryptoHelper.Decrypt(user.LastName)}";

            // 3. Eğer kategori filtrelemesi gerekiyorsa burada yapabilirsiniz
            // if (category != "Hepsi" && !decryptedName.Contains(category)) continue;

            // 4. Yükü hesapla
            int currentLoad = await _context.Appointments
                .CountAsync(a => a.TherapistId == user.Id && a.AppointmentDate >= DateTime.Now);

            result.Add(new TherapistAvailabilityDto
            {
                Id = user.Id,
                Name = decryptedName, // Düzgün isim
                Category = "BÜREM Uzmanı",
                Campus = "Kuzey",
                CurrentLoad = currentLoad,
                DailySlots = 5 - (currentLoad % 5),
                WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
            });
        }

        return Ok(result);
    }

    // 2. Randevu Oluştur ve Mail Gönder
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        // A. Validasyon: Tarih ve Saat formatını kontrol et
        // Frontend'den gelen format: "dd.MM.yyyy" ve "HH:mm"
        if (!DateTime.TryParseExact($"{dto.Date} {dto.Time}", "dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime appointmentDateTime))
        {
            return BadRequest("Tarih formatı hatalı.");
        }

        // B. Veritabanına Kayıt (Appointment Tablosu)
        var appointment = new Appointment
        {
            SessionId = dto.SessionId,
            TherapistId = dto.TherapistId,
            AppointmentDate = appointmentDateTime,
            AppointmentType = dto.Type,
            LocationOrLink = dto.RoomLink,
            CreatedAt = DateTime.Now
        };

        _context.Appointments.Add(appointment);

        // C. Session Tablosunu Güncelle (Danışman Atandı)
        var session = await _context.Sessions
                                    .Include(s => s.Student) // Mail gönderimi için öğrenci bilgisine ihtiyacımız var
                                    .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session != null)
        {
            // Session kaydına atanan danışmanı işle
            session.AdvisorId = dto.TherapistId;

            // D. Terapist Bilgisini Çek ve İsimleri Çöz (Şifreli olduğu için)
            // Veritabanında isimler şifreli (Örn: "U2FsdGVk...") durduğu için CryptoHelper ile çözüyoruz.
            var therapist = await _context.Users.FindAsync(dto.TherapistId);
            string therapistName = "Uzman";

            if (therapist != null)
            {
                string fName = CryptoHelper.Decrypt(therapist.FirstName);
                string lName = CryptoHelper.Decrypt(therapist.LastName);
                therapistName = $"{fName} {lName}";
            }

            // E. MAİL GÖNDERİMİ
            // Öğrenciye bilgilendirme maili gönderiliyor
            if (session.Student != null && !string.IsNullOrEmpty(session.Student.Email))
            {
                _mailHelper.SendAppointmentEmail(
                    session.Student.Email,
                    $"{session.Student.FirstName} {session.Student.LastName}", // Öğrenci isimleri şifresiz varsayıldı
                    therapistName, // Çözülmüş Terapist İsmi (Örn: Ayşe Yılmaz)
                    dto.Date,
                    dto.Time,
                    dto.Type,
                    dto.RoomLink
                );
            }
        }

        // Tüm değişiklikleri (Appointment ekleme ve Session güncelleme) kaydet
        await _context.SaveChangesAsync();

        return Ok(new { message = "Randevu oluşturuldu ve bilgilendirme maili gönderildi." });
    }
}