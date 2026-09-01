import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { MaterialService } from "./material.service.js";
import { MATERIAL_MESSAGES } from "./material.constant.js";
import { MaterialValidation } from "./material.validation.js";

const createMaterial = catchAsync(async (req, res) => {
  const result = await MaterialService.createMaterial(req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: MATERIAL_MESSAGES.MATERIAL_CREATED,
    data: result,
  });
});

const getMaterials = catchAsync(async (req, res) => {
  const result = await MaterialService.getMaterials(req.user._id, req.user.role, req.query);

  sendResponse(res, {

    statusCode: 200,
    success: true,
    message: MATERIAL_MESSAGES.MATERIALS_FETCHED,
    data: result,
  });
});

const getMaterialById = catchAsync(async (req, res) => {
  const result = await MaterialService.getMaterialById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: MATERIAL_MESSAGES.MATERIAL_FETCHED,
    data: result,
  });
});

const updateMaterial = catchAsync(async (req, res) => {
  const result = await MaterialService.updateMaterial(req.params.id, req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: MATERIAL_MESSAGES.MATERIAL_UPDATED,
    data: result,
  });
});

const deleteMaterial = catchAsync(async (req, res) => {
  const result = await MaterialService.deleteMaterial(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const MaterialController = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
