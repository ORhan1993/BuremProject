using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Burem.Data.Models;
using Burem.API.DTOs;
using Burem.Data;

[Route("api/[controller]")]
[ApiController]
public class ContentController : ControllerBase
{
    private readonly BuremDbContext _context;

    public ContentController(BuremDbContext context)
    {
        _context = context;
    }

    // GET: api/Content/GetByKeys
    [HttpGet("GetByKeys")]
    public async Task<IActionResult> GetContents([FromQuery] string[] keys)
    {
        // İstenen key'lere sahip içerikleri getir
        var contents = await _context.SiteContents
                                     .Where(x => keys.Contains(x.ContentKey))
                                     .Select(x => new SiteContentDto { Key = x.ContentKey, Value = x.ContentValue })
                                     .ToListAsync();
        return Ok(contents);
    }

  

    // GET: api/Content/GetAll
    // Parametre almaya gerek yok, hepsini çekip Frontend'de filtreleyeceğiz.
    [HttpGet("GetAll")]
    public async Task<IActionResult> GetAllContents()
    {
        var contents = await _context.SiteContents
                                     .OrderBy(x => x.Id) // ID sırasına göre gelmesi çok önemli!
                                     .Select(x => new SiteContentDto
                                     {
                                         Key = x.ContentKey,
                                         Value = x.ContentValue
                                     })
                                     .ToListAsync();
        return Ok(contents);
    }

    // PUT: api/Content/Update
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateContent([FromBody] SiteContentDto dto)
    {
        var content = await _context.SiteContents.FirstOrDefaultAsync(x => x.ContentKey == dto.Key);
        if (content == null) return NotFound("İçerik bulunamadı.");

        content.ContentValue = dto.Value;
        await _context.SaveChangesAsync();
        return Ok(content);
    }
}