// import { Router } from "express";
// import { Role } from "../../../generated/prisma/client";
// import { upload } from "../../lib/multer";
// import { auth } from "../../middleware/checkAuth";
// import { FileController } from "./file.controller";

// const router = Router();

// router.post(
// 	"/upload",
// 	auth(Role.DONOR, Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
// 	upload.single("file"),
// 	FileController.uploadSingleFile,
// );

// router.post(
// 	"/upload-multiple",
// 	auth(Role.DONOR, Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
// 	upload.array("files", 5),
// 	FileController.uploadMultipleFiles,
// );

// export const FileRoutes = router;
