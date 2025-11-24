using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;
using Burem.API.DTOs;
using Burem.API.Helpers; // MailHelper burada
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

    // 1. Müsait Terapistleri Getir (Gerçek Veri)
    [HttpGet("AvailableTherapists")]
    public async Task<IActionResult> GetAvailableTherapists(string category)
    {
        // User tablosundan "Terapist" rolündekileri çek
        // Not: UserType "4" terapist ise.
        var query = _context.Users.Where(u => u.UserType == 4);

        // Eğer veritabanında "Category" alanı yoksa şimdilik isimden filtreleme yapıyoruz
        // Gerçek senaryoda User tablosuna "Category" kolonu eklenmeli.

        var therapists = await query.Select(u => new TherapistAvailabilityDto
        {
            Id = u.Id,
            Name = u.FirstName + " " + u.LastName,
            Category = "BÜREM Uzmanı", // Varsayılan
            Campus = "Kuzey",         // Varsayılan
            CurrentLoad = _context.Appointments.Count(a => a.TherapistId == u.Id && a.AppointmentDate > DateTime.Now),
            DailySlots = 5,
            WorkingDays = new List<string> { "Pzt", "Sal", "Çar", "Per", "Cum" }
        }).ToListAsync();

        return Ok(therapists);
    }

    // 2. Randevu Oluştur ve Mail Gönder
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        // A. Validasyon
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
                                    .Include(s => s.Student) // Mail için öğrenciye ihtiyacımız var
                                    .FirstOrDefaultAsync(s => s.Id == dto.SessionId);

        if (session != null)
        {
            session.AdvisorId = dto.TherapistId;

            // D. Terapist Bilgisini Çek (Mail için)
            var therapist = await _context.Users.FindAsync(dto.TherapistId);
            string therapistName = therapist != null ? $"{therapist.FirstName} {therapist.LastName}" : "Uzman";

            // E. MAİL GÖNDERİMİ (Dokümandaki Format)
            if (!string.IsNullOrEmpty(session.Student.Email))
            {
                _mailHelper.SendAppointmentEmail(
                    session.Student.Email,
                    $"{session.Student.FirstName} {session.Student.LastName}",
                    therapistName,
                    dto.Date,
                    dto.Time,
                    dto.Type,
                    dto.RoomLink
                );
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Randevu oluşturuldu ve bilgilendirme maili gönderildi." });
    }
}