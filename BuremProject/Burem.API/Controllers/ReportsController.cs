using Burem.API.DTOs;
using Burem.Data.Enums;
using Burem.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly BuremDbContext _context;

        public ReportsController(BuremDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public IActionResult GetDashboardStats()
        {
            var appointments = _context.Appointments.Include(a => a.Therapist).ToList();
            var total = appointments.Count;

            if (total == 0) return Ok(new DashboardStatsDto());

            // 1. Genel İstatistikler
            var stats = new DashboardStatsDto
            {
                TotalAppointments = total,
                CompletedCount = appointments.Count(a => a.Status == AppointmentStatus.Completed),
                NoShowCount = appointments.Count(a => a.Status == AppointmentStatus.NoShow),
                CancelledCount = appointments.Count(a => a.Status == AppointmentStatus.Cancelled),
            };

            // No-Show Oranı Hesaplama
            // (NoShow / (Toplam - İptal)) * 100 -> İptaller genellikle paydaya dahil edilmez ama analiz isteğine göre değişir.
            // Burada basit oran: NoShow / Toplam Randevu
            stats.NoShowRate = Math.Round((double)stats.NoShowCount / total * 100, 2);

            // 2. Terapist Türüne Göre Dağılım
            stats.TherapistStats = appointments
                .Where(a => a.Therapist != null)
                .GroupBy(a => a.Therapist.TherapistCategory)
                .Select(g => new TherapistStatDto
                {
                    Category = g.Key.ToString(), // "Discounted", "Experienced" vs. döner
                    Count = g.Count()
                })
                .ToList();

            return Ok(stats);
        }
    }
}