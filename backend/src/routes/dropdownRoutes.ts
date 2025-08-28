import { Router } from "express";
import { DropdownController } from "../controllers/DropdownController.js";

export const dropdownRoutes = Router();

// Get all dropdowns grouped by field for a specific module
dropdownRoutes.get("/module/:moduleName", DropdownController.getDropdownsByModule);

// Get dropdowns for a specific module and field
dropdownRoutes.get("/module/:moduleName/field/:fieldName", DropdownController.getDropdownsByModuleAndField);

// Get all dropdowns
dropdownRoutes.get("/", DropdownController.getAllDropdowns);

// Create a new dropdown
dropdownRoutes.post("/", DropdownController.createDropdown);

// Delete a dropdown
dropdownRoutes.delete("/:id", DropdownController.deleteDropdown);
