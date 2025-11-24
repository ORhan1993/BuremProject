using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class Question
{
    public int Id { get; set; }

    public string? QuestionTitleForStudents { get; set; }

    public string QuestionTitle { get; set; } = null!;

    public int QuestionType { get; set; }

    public int SameOptionsWith { get; set; }

    public int? SortOrder { get; set; }

    public bool IsActive { get; set; }

    public byte DisplayOrderNo { get; set; }

    public byte IsProfileQuestion { get; set; }

    public byte CanStudentAnswer { get; set; }

    public byte AppForm { get; set; }

    public byte FeedBackForm { get; set; }

    public int? QuestionGroup { get; set; }

    public virtual ICollection<Option> Options { get; set; } = new List<Option>();
}
