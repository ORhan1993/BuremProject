using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models;

public partial class Session
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public DateTime SessionDate { get; set; }

    public int AdvisorId { get; set; }

    [ForeignKey("AdvisorId")]
    public virtual User? Advisor { get; set; }

    public int? DanismanO { get; set; }

    public int? DanismanG { get; set; }

    public int? DanismanB { get; set; }

    public bool? IsArchived { get; set; }

    public bool? IsOnline { get; set; }

    public bool? Disclaimer { get; set; }

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual Student Student { get; set; } = null!;


}
