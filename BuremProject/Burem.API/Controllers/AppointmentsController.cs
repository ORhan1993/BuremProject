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

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet("AvailableTherapists")]
        public async Task<IActionResult> GetAvailableTherapists(string category)
        {
            var result = await _appointmentService.GetAvailableTherapistsAsync(category);
            return Ok(result);
        }

        [HttpGet("All")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var result = await _appointmentService.GetAllAppointmentsAsync();
            return Ok(result);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
        {
            var result = await _appointmentService.CreateAppointmentAsync(dto);
            if (result.IsSuccess) return Ok(result);
            return BadRequest(result);
        }

        [HttpPost("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateAppointmentStatusDto dto)
        {
            var result = await _appointmentService.UpdateStatusAsync(dto);
            if (result.IsSuccess) return Ok(result);
            return BadRequest(result);
        }

        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots(int therapistId, DateTime date)
        {
            var slots = await _appointmentService.GetAvailableHoursAsync(therapistId, date);
            return Ok(slots);
        }

        [HttpPost("add-holiday")]
        public async Task<IActionResult> AddHoliday([FromBody] AddHolidayDto dto)
        {
            var result = await _appointmentService.AddCustomHolidayAsync(dto);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("MyAppointments")]
        // [Authorize(Roles = "Therapist")] // Sadece terapistler görebilsin
        public async Task<IActionResult> GetMyAppointments()
        {
            // Terapist ID'sini token'dan alıyoruz
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Test için (Token yoksa) elle ID veriyoruz:
            int therapistId = int.TryParse(userIdString, out int id) ? id : 1;

            var result = await _appointmentService.GetTherapistAppointmentsAsync(therapistId);
            return Ok(result);
        }
    }
}