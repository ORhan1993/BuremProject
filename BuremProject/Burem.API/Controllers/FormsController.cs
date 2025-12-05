using Burem.API.Abstract;
using Burem.API.DTOs;
using Burem.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class FormsController : ControllerBase
{
    private readonly IFormService _formService;

    public FormsController(IFormService formService)
    {
        _formService = formService;
    }

    [HttpGet("questions/app-form")]
    public async Task<IActionResult> GetAppFormQuestions()
    {
        var questions = await _formService.GetAppFormQuestionsAsync();
        return Ok(questions);
    }
    // POST: api/Forms/CreateQuestion
    [HttpPost("CreateQuestion")]
    public async Task<IActionResult> CreateQuestion([FromBody] QuestionDto dto)
    {
        var result = await _formService.CreateQuestionAsync(dto);

        if (!result.IsSuccess)
            return BadRequest(result);

        // Başarılıysa ID'yi veya sonucu dön
        return Ok(result.Data);
    }

    // DELETE: api/Forms/DeleteQuestion/5
    [HttpDelete("DeleteQuestion/{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var result = await _formService.DeleteQuestionAsync(id);

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }
    /*

    [HttpGet("Questions")]
    public async Task<IActionResult> GetQuestions()
    {
        var result = await _formService.GetAllQuestionsForFormAsync();

        if (result == null || !result.Any())
        {
            // Frontend 404 alınca hata vermesin diye boş liste de dönebilirsin
            // return Ok(new List<QuestionDto>());
            return NotFound("Soru bulunamadı.");
        }

        return Ok(result);
    }
    */

    [HttpGet("Questions")]
    public async Task<IActionResult> GetQuestions()
    {
        // Servise git ve işi yaptır
        var result = await _formService.GetAppFormQuestionsAsync();

        // Sonuç başarılı mı?
        if (result.IsSuccess)
        {
            return Ok(result.Data);
        }

        // Başarısızsa servisten gelen hatayı dön (404 veya 500)
        if (result.StatusCode == 404) return NotFound(result.Message);

        return BadRequest(result.Message);
    }
}