using Burem.API.Concrete;
using Burem.API.DTOs;

namespace Burem.API.Abstract
{
    public interface IUserService
    {
        // READ
        Task<List<UserListDto>> GetUserListAsync();

        // CREATE
        Task<ServiceResult> CreateUserAsync(UserCreateDto userDto);

        // UPDATE
        Task<ServiceResult> UpdateUserAsync(UserUpdateDto userDto);

        // DELETE (Burada IsDeleted = TRUE yapılır)
        Task<ServiceResult> DeleteUserAsync(int userId);
    }
}
