using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class ErrorLog
{
    public int ErrorId { get; set; }

    public string? ErrorTitle { get; set; }

    public string? ErrorContent { get; set; }
}
