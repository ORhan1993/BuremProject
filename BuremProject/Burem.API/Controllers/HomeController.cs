using Burem.API.Abstract;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SecretariesController : ControllerBase
    {
        private readonly IUserService _userService;

        public SecretariesController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("List")]
        public async Task<IActionResult> GetList()
        {
            var users = await _userService.GetUserListAsync();
            // Rolü Sekreter olanları filtrele
            var secretaries = users.Where(x => x.UserType == "Sekreter").ToList();
            return Ok(secretaries);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _userService.DeleteUserAsync(id);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }
    }
}