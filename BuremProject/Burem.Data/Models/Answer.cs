using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class Answer
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public int QuestionId { get; set; }

    public string QuestionTitle { get; set; } = null!;

    public string? OptionValue { get; set; }

    public string? OptionTitle { get; set; }

    public int SessionId { get; set; }

    public byte AppForm { get; set; }

    public byte FeedBackForm { get; set; }

    public virtual Session Session { get; set; } = null!;
}
