using Microsoft.AspNetCore.Mvc;
using Burem.API.Abstract;
using Burem.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        // Dependency Injection: Sadece Session servisini istiyoruz
        public SessionsController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        // GET: api/Sessions/13170
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSessionDetail(int id)
        {
            var result = await _sessionService.GetSessionDetailAsync(id);

            if (result == null)
            {
                return NotFound(new { message = "Başvuru bulunamadı." });
            }

            return Ok(result);
        }

        // PUT: api/Sessions/13170
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] List<UpdateSessionAnswersDto> updatedAnswers)
        {
            var success = await _sessionService.UpdateSessionAnswersAsync(id, updatedAnswers);

            if (!success)
            {
                return NotFound(new { message = "Başvuru bulunamadı veya güncellenemedi." });
            }

            return Ok(new { message = "Başvuru başarıyla güncellendi." });
        }
    }
}