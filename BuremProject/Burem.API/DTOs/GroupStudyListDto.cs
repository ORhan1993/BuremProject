namespace Burem.API.DTOs
{
    public class GroupStudyListDto
    {
        public int Id { get; set; }
        public string GroupName { get; set; }
        public DateTime? StartDate { get; set; }
        public string Status { get; set; }
    }
}
