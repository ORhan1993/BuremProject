using Burem.API.DTOs;
using Burem.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupsController : ControllerBase
    {
        private readonly BuremDbContext _context;

        public GroupsController(BuremDbContext context)
        {
            _context = context;
        }

        [HttpGet("List/{therapistId}")]
        public async Task<IActionResult> List(int therapistId)
        {
            var groups = await _context.GroupStudies
                .Where(g => g.TherapistId == therapistId && g.IsActive)
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => new GroupStudyListDto
                {
                    Id = g.Id,
                    GroupName = g.GroupName,
                    StartDate = g.StartDate,
                    Status = g.CompletionStatus
                }).ToListAsync();

            return Ok(groups);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create(CreateGroupStudyDto dto)
        {
            DateTime.TryParseExact(dto.StartDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime start);
            DateTime.TryParseExact(dto.EndDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime end);

            var group = new GroupStudy
            {
                TherapistId = dto.TherapistId,
                GroupName = dto.GroupName,
                StartDate = start == DateTime.MinValue ? null : start,
                EndDate = end == DateTime.MinValue ? null : end,
                SessionCount = dto.SessionCount,
                CompletionStatus = dto.CompletionStatus,
                CreatedAt = DateTime.Now,
                IsActive = true
            };

            _context.GroupStudies.Add(group);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Grup çalışması kaydedildi." });
        }
    }
}