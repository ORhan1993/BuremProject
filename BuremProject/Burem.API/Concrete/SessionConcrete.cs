using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data;
using Burem.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
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
            var session = await _context.Sessions
                                        .Include(s => s.Student)
                                        .FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session == null) return null;

            string advisorName = "Atanmamış";
            if (session.AdvisorId > 0)
            {
                var advisor = await _context.Users.FindAsync(session.AdvisorId);
                if (advisor != null)
                {
                    string fName = !string.IsNullOrEmpty(advisor.FirstName) ? CryptoHelper.Decrypt(advisor.FirstName) : "";
                    string lName = !string.IsNullOrEmpty(advisor.LastName) ? CryptoHelper.Decrypt(advisor.LastName) : "";
                    advisorName = $"{fName} {lName}".Trim();
                }
                else
                {
                    var therapist = await _context.Therapists.FindAsync(session.AdvisorId);
                    if (therapist != null) advisorName = $"{therapist.FirstName} {therapist.LastName}";
                }
            }

            var answers = await _context.Answers.Where(a => a.SessionId == sessionId).ToListAsync();
            var meetingPreferenceAnswer = answers.FirstOrDefault(a => a.QuestionId == 220);
            string preferredType = "";

            if (meetingPreferenceAnswer != null)
            {
                var val = meetingPreferenceAnswer.OptionValue?.ToLowerInvariant()?.Trim() ?? "";
                if (val == "1" || val.Contains("çevrimiçi")) preferredType = "Çevrimiçi";
                else if (val == "2" || val.Contains("yüzyüze")) preferredType = "Yüzyüze";
                else preferredType = meetingPreferenceAnswer.OptionValue;
            }

            var questionIds = answers.Select(a => a.QuestionId).Distinct().ToList();
            var questions = await _context.Questions
                                            .Where(q => questionIds.Contains(q.Id))
                                            .Where(q => q.AppForm == 1)
                                            .Include(q => q.Options)
                                            .ToListAsync();

            var dto = new SessionDetailDto
            {
                SessionId = session.Id,
                StudentName = $"{CryptoHelper.Decrypt(session.Student?.FirstName)} {CryptoHelper.Decrypt(session.Student?.LastName)}",
                StudentNumber = session.Student?.StudentNo,
                SessionDate = session.SessionDate.ToString("dd.MM.yyyy"),
                AdvisorName = advisorName,
                PreferredMeetingType = preferredType,

                // --- EKSİK BİLGİLERİ DOLDURUYORUZ ---
                Faculty = session.Student?.Faculty ?? "-",
                Department = session.Student?.Department ?? "-",
                Phone = session.Student?.MobilePhone ?? "-",
                Email = session.Student?.Email ?? "-",
                ClassLevel = (session.Student?.Semester.HasValue == true)
                     ? Math.Ceiling(session.Student.Semester.Value / 2.0) + ". Sınıf"
                     : "-",
                // -----------------------------------

                Answers = new List<SessionAnswerDto>()
            };

            foreach (var ans in answers)
            {
                var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
                if (q == null) continue;

                string displayAnswer = ans.OptionValue;
                if (q.Options != null && q.Options.Any())
                {
                    var matchedOption = q.Options.FirstOrDefault(o => o.OptionValue == ans.OptionValue);
                    if (matchedOption != null)
                    {
                        displayAnswer = !string.IsNullOrEmpty(matchedOption.OptionTitleStudent) ? matchedOption.OptionTitleStudent : matchedOption.OptionTitle;
                    }
                }

                dto.Answers.Add(new SessionAnswerDto
                {
                    QuestionId = q.Id,
                    QuestionTitle = q.QuestionTitle,
                    QuestionType = q.QuestionType.ToString(),
                    AnswerValue = displayAnswer,
                    Options = q.Options.OrderBy(o => o.SortOrder).Select(o => new SessionOptionDto
                    {
                        Label = !string.IsNullOrEmpty(o.OptionTitleStudent) ? o.OptionTitleStudent : o.OptionTitle,
                        Value = o.OptionValue
                    }).ToList()
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

        public async Task<List<PendingSessionDto>> GetPendingSessionsAsync()
        {
            var sessions = await _context.Sessions
                .Include(s => s.Student)
                .Where(s => s.IsArchived == false
                            && s.Status != "Devam Ediyor"
                            && s.Status != "Yönlendirildi"
                            && (s.AdvisorId == 0 || s.AdvisorId == null))
                .OrderByDescending(s => s.SessionDate)
                .ToListAsync();

            return sessions.Select(s => new PendingSessionDto
            {
                Id = s.Id,
                Name = !string.IsNullOrEmpty(s.Student.FirstName) ? $"{CryptoHelper.Decrypt(s.Student.FirstName)} {CryptoHelper.Decrypt(s.Student.LastName)}" : "İsimsiz",
                StudentNo = s.Student.StudentNo,
                Faculty = s.Student.Faculty,
                Department = s.Student.Department,
                Email = s.Student.Email,
                Phone = s.Student.MobilePhone ?? "Belirtilmemiş",
                ClassLevel = s.Student.Semester.HasValue ? Math.Ceiling(s.Student.Semester.Value / 2.0) + ". Sınıf" : "-",
                Term = s.Student.Semester ?? 0,
                RequestDate = s.SessionDate.ToString("dd.MM.yyyy"),
                Status = "Atama Bekliyor",
                ApplicationType = s.SessionNumber == 1 ? "İlk Başvuru" : "Tekrar Başvuru",
                KvkkApproved = true
            }).ToList();
        }
    }
}