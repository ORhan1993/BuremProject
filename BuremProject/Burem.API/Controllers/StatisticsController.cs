using Burem.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly BuremDbContext _context;

        public StatisticsController(BuremDbContext context)
        {
            _context = context;
        }

        [HttpGet("Dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // İstatistikleri veritabanından canlı çekiyoruz
            var totalStudents = await _context.Students.CountAsync();
            var totalSessions = await _context.Sessions.CountAsync();

            // Bugünkü seanslar
            var today = DateTime.Today;
            var todaySessions = await _context.Sessions
                                              .Where(s => s.SessionDate.Date == today)
                                              .CountAsync();

            // Bekleyen formlar/başvurular (Örn: Henüz onaylanmamış veya tarihi gelmemiş)
            // Mantığınıza göre burayı filtreleyebilirsiniz. Örn: Status == null
            var pendingForms = await _context.Sessions
                                             .Where(s => s.Status == null || s.Status == "Bekliyor")
                                             .CountAsync();

            // Riskli vakalar (RiskLevel dolu olanlar)
            var riskCases = await _context.Sessions
                                          .Where(s => !string.IsNullOrEmpty(s.RiskLevel) && s.RiskLevel != "Düşük")
                                          .CountAsync();

            // Aktif Vakalar (Arşivlenmemiş öğrenciler)
            // Basitçe aktif öğrenci sayısı veya aktif seans sayısı
            var activeCases = await _context.Sessions
                                            .Where(s => s.IsArchived == false)
                                            .CountAsync();

            var completedProcess = await _context.Sessions
                                                 .Where(s => s.IsArchived == true)
                                                 .CountAsync();

            return Ok(new
            {
                totalStudents,
                totalSessions,
                todaySessions,
                pendingForms,
                activeCases,
                riskCases,
                completedProcess
            });
        }
    }
}