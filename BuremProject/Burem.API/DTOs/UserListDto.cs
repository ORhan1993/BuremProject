namespace Burem.API.DTOs
{
    public class UserListDto
    {
        // Tablonuzdaki ID
        public int Id { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string UserType { get; set; } // Tablonuzdaki UserType (Admin, Secretary, Therapist)
        public bool IsActive { get; set; } // Status ve IsDeleted'ın birleşimi
    }
}
