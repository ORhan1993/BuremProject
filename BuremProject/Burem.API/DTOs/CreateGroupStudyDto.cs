using System;

namespace Burem.API.DTOs
{
    public class CreateGroupStudyDto
    {
        public int TherapistId { get; set; }
        public string GroupName { get; set; }
        public string StartDate { get; set; } // Frontend string gönderiyor
        public string EndDate { get; set; }
        public int SessionCount { get; set; }
        public string CompletionStatus { get; set; }
    }

   
}