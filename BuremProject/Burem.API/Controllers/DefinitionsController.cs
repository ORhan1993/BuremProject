using Burem.API.Abstract;
using Burem.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DefinitionsController : ControllerBase
    {
        private readonly IDefinitionService _service;

        public DefinitionsController(IDefinitionService service)
        {
            _service = service;
        }

        // ================= KAMPÜS =================
        [HttpGet("campuses")]
        public async Task<IActionResult> GetCampuses()
            => Ok(await _service.GetCampusesAsync());

        [HttpPost("campuses")]
        public async Task<IActionResult> AddCampus([FromBody] CreateDefinitionDto dto)
        {
            var result = await _service.AddCampusAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("campuses")]
        public async Task<IActionResult> UpdateCampus([FromBody] UpdateDefinitionDto dto)
        {
            var result = await _service.UpdateCampusAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("campuses/{id}")]
        public async Task<IActionResult> DeleteCampus(int id)
        {
            var result = await _service.DeleteCampusAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // ================= UZMAN TİPİ =================
        [HttpGet("therapist-types")]
        public async Task<IActionResult> GetTherapistTypes()
            => Ok(await _service.GetTherapistTypesAsync());

        [HttpPost("therapist-types")]
        public async Task<IActionResult> AddTherapistType([FromBody] CreateDefinitionDto dto)
        {
            var result = await _service.AddTherapistTypeAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("therapist-types")]
        public async Task<IActionResult> UpdateTherapistType([FromBody] UpdateDefinitionDto dto)
        {
            var result = await _service.UpdateTherapistTypeAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("therapist-types/{id}")]
        public async Task<IActionResult> DeleteTherapistType(int id)
        {
            var result = await _service.DeleteTherapistTypeAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // ================= ROL =================
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
            => Ok(await _service.GetRolesAsync());

        [HttpPost("roles")]
        public async Task<IActionResult> AddRole([FromBody] CreateDefinitionDto dto)
        {
            var result = await _service.AddRoleAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("roles")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateDefinitionDto dto)
        {
            var result = await _service.UpdateRoleAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var result = await _service.DeleteRoleAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // ================= RESMİ TATİL =================
        [HttpGet("holidays")]
        public async Task<IActionResult> GetHolidays()
        {
            var result = await _service.GetHolidaysAsync();
            return Ok(result);
        }

        [HttpPost("add-holiday")]
        public async Task<IActionResult> AddHoliday([FromBody] CreateHolidayDto dto)
        {
            var result = await _service.AddHolidayAsync(dto);
            if (result.IsSuccess) return Ok(result);
            return BadRequest(result);
        }

        [HttpDelete("holidays/{id}")]
        public async Task<IActionResult> DeleteHoliday(int id)
        {
            var result = await _service.DeleteHolidayAsync(id);
            if (result.IsSuccess) return Ok(result);
            return BadRequest(result);
        }
    }
}