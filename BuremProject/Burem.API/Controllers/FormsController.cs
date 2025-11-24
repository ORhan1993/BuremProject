using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;
using Burem.API.DTOs;

[Route("api/[controller]")]
[ApiController]
public class FormsController : ControllerBase
{
    private readonly BuremDbContext _context;

    public FormsController(BuremDbContext context)
    {
        _context = context;
    }

    // GET: api/Forms/Questions
    // GET: api/Forms/Questions
    [HttpGet("Questions")]
    public async Task<IActionResult> GetFormQuestions()
    {
        var questions = await _context.Questions
                                      .Include(q => q.Options)
                                      .Where(q => q.IsActive == true) // isActive tablosundaki isimlendirmeye dikkat et
                                      .OrderBy(q => q.SortOrder)
                                      .ToListAsync();

        var questionDtos = questions.Select(q => new QuestionDto
        {
            ID = q.Id,
            QuestionTitle = q.QuestionTitleForStudents ?? q.QuestionTitle,
            QuestionType = q.QuestionType,
            SortOrder = q.SortOrder,
            QuestionGroupId = q.QuestionGroup, // <-- VERİTABANINDAN GRUP ID'SİNİ ÇEKİYORUZ
            Options = q.Options.Select(o => new OptionDto
            {
                ID = o.Id,
                OptionTitle = o.OptionTitleStudent ?? o.OptionTitle,
                OptionValue = o.OptionValue,
                SortOrder = o.SortOrder
            }).OrderBy(o => o.SortOrder).ToList()
        }).ToList();

        return Ok(questionDtos);
    }

    // POST: api/Forms/CreateQuestion
    [HttpPost("CreateQuestion")]
    public async Task<IActionResult> CreateQuestion([FromBody] QuestionDto dto)
    {
        var newQuestion = new Question
        {
            QuestionTitle = dto.QuestionTitle,
            QuestionType = dto.QuestionType,
            // DÜZELTME: Soru sırası boşsa 0 yap
            SortOrder = dto.SortOrder ?? 0,
            IsActive = true,

            Options = dto.Options.Select(o => new Option
            {
                OptionTitle = o.OptionTitle,
                OptionValue = o.OptionValue,
                // DÜZELTME: Seçenek sırası boşsa 0 yap (Veritabanında not null olduğu için zorunlu)
                SortOrder = o.SortOrder ?? 0
            }).ToList()
        };

        _context.Questions.Add(newQuestion);
        await _context.SaveChangesAsync();
        return Ok(newQuestion.Id);
    }

    // DELETE: api/Forms/DeleteQuestion/5
    [HttpDelete("DeleteQuestion/{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var question = await _context.Questions.Include(q => q.Options).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null) return NotFound();

        _context.Options.RemoveRange(question.Options); // Önce seçenekleri sil
        _context.Questions.Remove(question);            // Sonra soruyu sil
        await _context.SaveChangesAsync();
        return Ok();
    }
}