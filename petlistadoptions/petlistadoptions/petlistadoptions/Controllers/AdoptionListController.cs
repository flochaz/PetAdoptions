using Microsoft.AspNetCore.Mvc;

namespace PetListAdoptions.Controllers
{
    public class AdoptionListController : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}