using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class QuestionGroup
{
    public int Id { get; set; }

    public string GroupName { get; set; } = null!;

    public byte IsActive { get; set; }
}
