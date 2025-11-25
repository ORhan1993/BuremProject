using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Concrete
{
    public class SessionConcrete : ISessionService
    {
        private readonly BuremDbContext _context;

        public SessionConcrete(BuremDbContext context)
        {
            _context = context;
        }

        public async Task<SessionDetailDto> GetSessionDetailAsync(int sessionId)
        {
            // 1. Session ve Öğrenciyi Çek
            var session = await _context.Sessions
                                        .Include(s => s.Student)
                                        .FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session == null) return null;

            // 2. Danışman Adı
            string advisorName = "Atanmamış";
            if (session.AdvisorId > 0)
            {
                var advisor = await _context.Users.FindAsync(session.AdvisorId);
                advisorName = advisor != null ? $"{advisor.FirstName} {advisor.LastName}" : "Bilinmeyen";
            }

            // 3. Cevaplar
            var answers = await _context.Answers.Where(a => a.SessionId == sessionId).ToListAsync();

            // 4. Sorular ve Seçenekleri
            var questionIds = answers.Select(a => a.QuestionId).Distinct().ToList();
            var questions = await _context.Questions
                                          .Where(q => questionIds.Contains(q.Id))
                                          .Where(q => q.AppForm == 1)
                                          .Include(q => q.Options)
                                          .ToListAsync();

            // 5. DTO Oluştur
            var dto = new SessionDetailDto
            {
                SessionId = session.Id,
                StudentName = $"{session.Student.FirstName} {session.Student.LastName}",
                StudentNumber = session.Student.StudentNo,
                SessionDate = session.SessionDate.ToString("dd.MM.yyyy"),
                AdvisorName = advisorName,
                Answers = new List<SessionAnswerDto>()
            };

            foreach (var ans in answers)
            {
                var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
                if (q == null) continue;

                dto.Answers.Add(new SessionAnswerDto
                {
                    QuestionId = q.Id,
                    QuestionTitle = q.QuestionTitle,
                    QuestionType = q.QuestionType,
                    AnswerValue = ans.OptionValue,

                    // --- BURASI DÜZELTİLDİ ---
                    Options = q.Options
                               .OrderBy(o => o.SortOrder)
                               .Select(o => new SessionOptionDto
                               {
                                   // Eğer OptionTitleStudent boş değilse onu kullan, yoksa OptionTitle kullan
                                   Label = !string.IsNullOrEmpty(o.OptionTitleStudent) ? o.OptionTitleStudent : o.OptionTitle,
                                   Value = o.OptionValue
                               })
                               .ToList()
                });
            }

            return dto;
        }

        public async Task<bool> UpdateSessionAnswersAsync(int sessionId, List<UpdateSessionAnswersDto> updatedAnswers)
        {
            var session = await _context.Sessions.FindAsync(sessionId);
            if (session == null) return false;

            foreach (var item in updatedAnswers)
            {
                var ans = await _context.Answers.FirstOrDefaultAsync(a => a.SessionId == sessionId && a.QuestionId == item.QuestionId);
                if (ans != null) ans.OptionValue = item.Value;
            }
            await _context.SaveChangesAsync();
            return true;
        }
    }
}