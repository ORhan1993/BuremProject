using System;
using System.Collections.Generic;

namespace Burem.Data.Models;

public partial class Log
{
    public int Id { get; set; }

    public string? LogDescription { get; set; }

    public string? LogUser { get; set; }

    public DateTime? LogDate { get; set; }

    public string? LogIp { get; set; }
}
