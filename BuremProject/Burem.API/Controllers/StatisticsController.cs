using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;

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
        var today = DateTime.Today;

        // 1. Toplam Öğrenci Sayısı
        var totalStudents = await _context.Students.CountAsync();

        // 2. Toplam Başvuru Sayısı
        var totalSessions = await _context.Sessions.CountAsync();

        // 3. Bugünkü Başvurular
        var todaySessions = await _context.Sessions
                                          .Where(s => s.SessionDate >= today && s.SessionDate < today.AddDays(1))
                                          .CountAsync();

        // 4. Bekleyen (Arşivlenmemiş) Formlar
        var pendingForms = await _context.Sessions
                                         .Where(s => s.IsArchived != true)
                                         .CountAsync();

        return Ok(new
        {
            TotalStudents = totalStudents,
            TotalSessions = totalSessions,
            TodaySessions = todaySessions,
            PendingForms = pendingForms
        });
    }
}