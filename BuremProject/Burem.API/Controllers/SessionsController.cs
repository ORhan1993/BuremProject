using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;
using Burem.API.DTOs;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionsController : ControllerBase
    {
        private readonly BuremDbContext _context;

        public SessionsController(BuremDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSessionDetail(int id)
        {
            // 1. Session'ı çek
            var session = await _context.Sessions
                                        .Include(s => s.Student)
                                        .Include(s => s.Advisor)
                                        .FirstOrDefaultAsync(s => s.Id == id);

            if (session == null) return NotFound("Başvuru bulunamadı.");

            // 2. Cevapları çek
            var answers = await _context.Answers.Where(a => a.SessionId == id).ToListAsync();

            // 3. Soruları çek (Cevaplanan soruların başlıklarını almak için)
            var questionIds = answers.Select(a => a.QuestionId).Distinct().ToList();
            var questions = await _context.Questions
                                          .Where(q => questionIds.Contains(q.Id))
                                          .Include(q => q.Options)
                                          .ToListAsync();

            // 4. DTO Oluştur
            var dto = new SessionDetailDto
            {
                SessionId = session.Id,
                StudentName = $"{session.Student.FirstName} {session.Student.LastName}",
                SessionDate = session.SessionDate.ToString("dd.MM.yyyy"),
                AdvisorName = session.Advisor != null ? $"{session.Advisor.FirstName} {session.Advisor.LastName}" : "Atanmamış",
                Answers = new List<SessionAnswerDto>()
            };

            foreach (var ans in answers)
            {
                var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
                if (q == null) continue;

                // Şık Listesi (Radio/Checkbox ise)
                var optionsList = q.Options.OrderBy(o => o.SortOrder).Select(o => o.OptionValue).ToList();

                dto.Answers.Add(new SessionAnswerDto
                {
                    QuestionId = q.Id,
                    QuestionTitle = q.QuestionTitle,
                    QuestionType = q.QuestionType,
                    AnswerValue = ans.OptionValue,
                    Options = optionsList
                });
            }

            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] List<UpdateSessionAnswersDto> updatedAnswers)
        {
            var session = await _context.Sessions.FindAsync(id);
            if (session == null) return NotFound();

            foreach (var item in updatedAnswers)
            {
                var ans = await _context.Answers.FirstOrDefaultAsync(a => a.SessionId == id && a.QuestionId == item.QuestionId);
                if (ans != null) ans.OptionValue = item.Value;
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Güncellendi" });
        }
    }
}