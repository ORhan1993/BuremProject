using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class QuestionType
{
    public int Id { get; set; }

    public string QuestionType1 { get; set; } = null!;

    public bool HasOptions { get; set; }
}
