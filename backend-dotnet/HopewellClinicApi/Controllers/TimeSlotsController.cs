using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Data;
using HopewellClinicApi.DTOs;

namespace HopewellClinicApi.Controllers
{
    [ApiController]
    [Route("api/time-slots")]
    public class TimeSlotsController : ControllerBase
    {
        private readonly HopewellDbContext _context;

        public TimeSlotsController(HopewellDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TimeSlotResponse>>> GetTimeSlots()
        {
            try
            {
                var timeSlots = await _context.TimeSlots
                    .Where(t => t.IsActive)
                    .Select(t => new TimeSlotResponse
                    {
                        Id = t.Id,
                        DayOfWeek = t.DayOfWeek,
                        StartTime = t.StartTime,
                        EndTime = t.EndTime,
                        IsActive = t.IsActive,
                        CreatedAt = t.CreatedAt
                    })
                    .ToListAsync();

                return Ok(timeSlots);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}