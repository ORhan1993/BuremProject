using Burem.Data;
using Burem.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TherapistsController : ControllerBase
    {
        private readonly BuremDbContext _context;

        public TherapistsController(BuremDbContext context)
        {
            _context = context;
        }

        // LISTELEME (READ)
        [HttpGet("List")]
        public async Task<IActionResult> GetList()
        {
            var therapists = await _context.Therapists
                .AsNoTracking()
                .Select(t => new
                {
                    Id = t.Id,
                    FirstName = t.FirstName,
                    LastName = t.LastName,
                    Email = t.Email,
                    RoleId = t.RoleId,
                    TherapistTypeId = t.TherapistTypeId,
                    CampusId = t.CampusId,
                    IsActive = t.IsActive
                })
                .ToListAsync();

            return Ok(therapists);
        }

        // EKLEME (CREATE)
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] Therapist model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("Eksik veya hatalı veri.");
            }

            try
            {
                // DÜZELTME BURADA YAPILDI:
                // '??' yerine ternary operator (?:) kullanıldı.
                // Eğer gelen veri 0 değilse (doluysa) onu kullan, 0 ise varsayılan değeri ata.

                var newTherapist = new Therapist
                {
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    RoleId = model.RoleId > 0 ? model.RoleId : 4, // Varsayılan 4

                    // int null olamayacağı için 0 kontrolü yapıyoruz:
                    TherapistTypeId = model.TherapistTypeId != 0 ? model.TherapistTypeId : 2,
                    CampusId = model.CampusId != 0 ? model.CampusId : 1,

                    IsActive = model.IsActive
                };

                _context.Therapists.Add(newTherapist);
                await _context.SaveChangesAsync();

                return Ok(new { succeeded = true, message = "Terapist başarıyla eklendi.", data = newTherapist });
            }
            catch (System.Exception ex)
            {
                return BadRequest($"Hata oluştu: {ex.Message}");
            }
        }

        // GÜNCELLEME (UPDATE)
        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Therapist model)
        {
            var existing = await _context.Therapists.FindAsync(id);

            if (existing == null)
            {
                return NotFound("Güncellenecek terapist bulunamadı.");
            }

            try
            {
                existing.FirstName = model.FirstName;
                existing.LastName = model.LastName;
                existing.Email = model.Email;
                existing.IsActive = model.IsActive;

                // DÜZELTME BURADA YAPILDI:
                // Null kontrolü yerine 0 kontrolü yapıyoruz.
                if (model.CampusId != 0) existing.CampusId = model.CampusId;
                if (model.TherapistTypeId != 0) existing.TherapistTypeId = model.TherapistTypeId;

                await _context.SaveChangesAsync();

                return Ok(new { succeeded = true, message = "Terapist bilgileri güncellendi." });
            }
            catch (System.Exception ex)
            {
                return BadRequest($"Güncelleme hatası: {ex.Message}");
            }
        }

        // SİLME (DELETE)
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var therapist = await _context.Therapists.FindAsync(id);

            if (therapist == null)
            {
                return NotFound("Silinecek terapist bulunamadı.");
            }

            try
            {
                _context.Therapists.Remove(therapist);
                await _context.SaveChangesAsync();

                return Ok(new { succeeded = true, message = "Terapist başarıyla silindi." });
            }
            catch (System.Exception ex)
            {
                return BadRequest($"Silme hatası: {ex.Message}");
            }
        }
    }
}