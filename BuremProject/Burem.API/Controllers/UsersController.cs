using Burem.API.Abstract;
using Burem.API.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Burem.API.Controllers
{
    [Route("api/[controller]")] // Rota: /api/Users
    [ApiController]
    // [Authorize(Roles = "Admin")] // Sadece Admin rolünün erişmesini sağlayabilirsiniz.
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        // Dependency Injection ile UserService'i alıyoruz
        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // 1. GET: /api/Users/List 
        // Frontend'deki agent.Users.list() bu endpoint'i çağırır.
        [HttpGet("List")]
        public async Task<ActionResult<List<UserListDto>>> GetUsers()
        {
            var users = await _userService.GetUserListAsync();
            return Ok(users);
        }

        // 2. POST: /api/Users/Create
        // Frontend'deki agent.Users.create() bu endpoint'i çağırır.
        [HttpPost("Create")]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateDto userDto)
        {
            var result = await _userService.CreateUserAsync(userDto);

            if (!result.IsSuccess)
            {
                return BadRequest(new { Message = result.Message });
            }
            return Ok(new { Message = result.Message });
        }

        // 3. PUT: /api/Users/Update/{id}
        // Frontend'deki agent.Users.update() bu endpoint'i çağırır.
        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateDto userDto)
        {
            if (id != userDto.Id)
            {
                return BadRequest("ID uyuşmazlığı var.");
            }

            var result = await _userService.UpdateUserAsync(userDto);

            if (!result.IsSuccess)
            {
                return NotFound(new { Message = result.Message });
            }
            return Ok(new { Message = result.Message });
        }

        // 4. DELETE: /api/Users/Delete/{id}
        // Frontend'deki agent.Users.delete() bu endpoint'i çağırır.
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var result = await _userService.DeleteUserAsync(id);

            if (!result.IsSuccess)
            {
                return NotFound(new { Message = result.Message });
            }
            return Ok(new { Message = result.Message });
        }
    }
}
