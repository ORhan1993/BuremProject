using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.API.Helpers;
using Burem.Data.Models;
using Microsoft.AspNetCore.Mvc;
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

            // 2. Danışman Adı (Şifre Çözme Eklenmiş Hali)
            string advisorName = "Atanmamış";
            if (session.AdvisorId > 0)
            {
                var advisor = await _context.Users.FindAsync(session.AdvisorId);
                if (advisor != null)
                {
                    // Şifreli isimleri çözüyoruz
                    string fName = !string.IsNullOrEmpty(advisor.FirstName) ? CryptoHelper.Decrypt(advisor.FirstName) : "";
                    string lName = !string.IsNullOrEmpty(advisor.LastName) ? CryptoHelper.Decrypt(advisor.LastName) : "";
                    advisorName = $"{fName} {lName}".Trim();
                }
            }

            // 3. Cevaplar
            var answers = await _context.Answers.Where(a => a.SessionId == sessionId).ToListAsync();

            // Görüşme Tercihi Tespiti (Soru ID: 220)
            var meetingPreferenceAnswer = answers.FirstOrDefault(a => a.QuestionId == 220);
            string preferredType = "";

            if (meetingPreferenceAnswer != null)
            {
                // Veritabanındaki değer null gelirse patlamasın, küçük harfe çevirip boşlukları temizleyelim.
                var val = meetingPreferenceAnswer.OptionValue?.ToLowerInvariant()?.Trim() ?? "";

                // 1. Durum: Online Kontrolü ("1" veya içinde "online" geçiyorsa)
                if (val == "1" || val.Contains("Çevrimiçi"))
                {
                    preferredType = "Çevrimiçi";
                }
                // 2. Durum: Yüzyüze Kontrolü ("2" veya içinde "yüz" geçiyorsa)
                else if (val == "2" || val.Contains("Yüzyüze"))
                {
                    preferredType = "Yüzyüze"; // Frontend'e standart bir kod gönderiyoruz
                }
                else
                {
                    // Tanımsız bir değerse olduğu gibi gönderelim (Debug için)
                    preferredType = meetingPreferenceAnswer.OptionValue;
                }
            }

            // 4. Sorular ve Seçenekleri
            // Sadece bu başvuruda cevaplanmış soruları ve AppForm=1 olanları çekiyoruz
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
                StudentName = $"{session.Student?.FirstName} {session.Student?.LastName}",
                StudentNumber = session.Student?.StudentNo,
                SessionDate = session.SessionDate.ToString("dd.MM.yyyy"),
                AdvisorName = advisorName,
                PreferredMeetingType = preferredType,
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
                    QuestionType = q.QuestionType, // Soru tipini ekledik (Radio, Checkbox vs için)
                    AnswerValue = ans.OptionValue,

                    // --- SEÇENEKLERİ DOLDURMA (Düzeltilen Kısım) ---
                    Options = q.Options
                                .OrderBy(o => o.SortOrder)
                                .Select(o => new SessionOptionDto
                                {
                                    // Eğer OptionTitleStudent (Öğrenciye görünen metin) boş değilse onu kullan, yoksa normal Title'ı kullan
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

        // Sekreterin atama yapması gereken (Danışmanı atanmamış) başvuruları getirir
        public async Task<List<PendingSessionDto>> GetPendingSessionsAsync()
        {
            var sessions = await _context.Sessions
                .Include(s => s.Student)
                .Include(s => s.Advisor)
                // Danışmanı olmayan (0/null) veya Danışmanı Terapist olmayan (Admin/Sistem) kayıtlar
                .Where(s => (s.AdvisorId == 0 || s.AdvisorId == null || (s.Advisor != null && s.Advisor.UserType != 4))
                            && s.IsArchived == false)
                .OrderByDescending(s => s.SessionDate) // En yeniden eskiye
                .ToListAsync();

            return sessions.Select(s => new PendingSessionDto
            {
                Id = s.Id,
                Name = !string.IsNullOrEmpty(s.Student.FirstName)
                       ? $"{CryptoHelper.Decrypt(s.Student.FirstName)} {CryptoHelper.Decrypt(s.Student.LastName)}"
                       : "İsimsiz",

                StudentNo = s.Student.StudentNo,
                Faculty = s.Student.Faculty,
                Department = s.Student.Department,
                Email = s.Student.Email,
                Phone = s.Student.MobilePhone ?? "Belirtilmemiş",

                // Sınıf hesabı (Dönem / 2)
                ClassLevel = s.Student.Semester.HasValue ? Math.Ceiling(s.Student.Semester.Value / 2.0) + ". Sınıf" : "-",
                Term = s.Student.Semester ?? 0,

                RequestDate = s.SessionDate.ToString("dd.MM.yyyy"),
                Status = "Atama Bekliyor",
                ApplicationType = s.SessionNumber == 1 ? "İlk Başvuru" : "Tekrar Başvuru",
                KvkkApproved = true // Başvuru yapıldıysa onaylanmıştır varsayımı
            }).ToList();
        }

    }
}