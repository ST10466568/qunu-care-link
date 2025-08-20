using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HopewellClinicApi.Data;
using HopewellClinicApi.DTOs;

namespace HopewellClinicApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly HopewellDbContext _context;

        public StaffController(HopewellDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaffResponse>>> GetStaff()
        {
            try
            {
                var staff = await _context.Staff
                    .Where(s => s.IsActive)
                    .Select(s => new StaffResponse
                    {
                        Id = s.Id,
                        UserId = s.UserId,
                        StaffNumber = s.StaffNumber,
                        FirstName = s.FirstName,
                        LastName = s.LastName,
                        Role = s.Role,
                        Phone = s.Phone,
                        IsActive = s.IsActive,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(staff);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}