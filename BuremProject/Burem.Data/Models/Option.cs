using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class Option
{
    public int Id { get; set; }

    public int QuestionId { get; set; }

    public string? OptionTitleStudent { get; set; }

    public string OptionTitle { get; set; } = null!;

    public string OptionValue { get; set; } = null!;

    public string? ParentOption { get; set; }

    public int SortOrder { get; set; }

    public virtual Question Question { get; set; } = null!;
}
