using Microsoft.AspNetCore.Mvc;
using Burem.API.Abstract;
using Burem.API.DTOs;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;

        public StudentsController(IStudentService studentService)
        {
            _studentService = studentService;
        }

        // GET: api/Students/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStudentById(int id)
        {
            var result = await _studentService.GetStudentProfileAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "Öðrenci bulunamadý." });
            }
            return Ok(result);
        }

        // POST: api/Students/search
        [HttpPost("search")]
        public async Task<IActionResult> SearchStudents([FromBody] SearchCriteriaDto criteria)
        {
            var result = await _studentService.SearchStudentsAsync(criteria);
            return Ok(result);
        }

        // StudentsController sýnýfýnýn içine ekle:

        // GET: api/Students/session/13170
        [HttpGet("session/{sessionId}")]
        public async Task<IActionResult> GetSessionDetail(int sessionId)
        {
            var result = await _studentService.GetSessionDetailAsync(sessionId);

            if (result == null)
            {
                return NotFound(new { message = "Baþvuru bulunamadý." });
            }

            return Ok(result);
        }
    }


}