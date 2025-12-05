using Burem.API.Abstract;
using Burem.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        // Dependency Injection ile servisi alıyoruz
        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        // GET: api/Appointments/AvailableTherapists
        [HttpGet("AvailableTherapists")]
        public async Task<IActionResult> GetAvailableTherapists(string category)
        {
            var result = await _appointmentService.GetAvailableTherapistsAsync(category);
            return Ok(result);
        }

        // POST: api/Appointments/Create
        [HttpPost("Create")]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var result = await _appointmentService.CreateAppointmentAsync(dto);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Message);
            }

            return Ok(new { message = result.Message });
        }

        [HttpGet("TherapistSchedule/{id}")]
        public async Task<IActionResult> GetTherapistSchedule(int id)
        {
            var result = await _appointmentService.GetTherapistScheduleAsync(id);
            return Ok(result);
        }
    }
}