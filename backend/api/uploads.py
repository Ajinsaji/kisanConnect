import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.models import User
from db.session import get_db

router = APIRouter()

# Use absolute path so uploads are always under backend/ regardless of cwd (e.g. uvicorn run from project root)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = _BACKEND_ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create subdirectories for different file types
IMAGES_DIR = UPLOAD_DIR / "images"
DOCUMENTS_DIR = UPLOAD_DIR / "documents"
IMAGES_DIR.mkdir(exist_ok=True)
DOCUMENTS_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff", "image/svg+xml"
}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",  # .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.ms-excel",  # .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "application/vnd.ms-powerpoint",  # .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
    "text/plain",
    "text/csv",
    "application/vnd.oasis.opendocument.text",  # .odt
    "application/vnd.oasis.opendocument.spreadsheet",  # .ods
}

# File extension to content type mapping (fallback)
EXTENSION_TO_TYPE = {
    # Images
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
    ".tiff": "image/tiff", ".svg": "image/svg+xml",
    # Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
}

def get_file_type(content_type: str | None, filename: str | None = None) -> str:
    """Determine if file is image or document."""
    # If content_type is None or empty, try to infer from filename
    if not content_type or content_type == "application/octet-stream":
        if filename:
            file_ext = Path(filename).suffix.lower()
            content_type = EXTENSION_TO_TYPE.get(file_ext)
            if not content_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type not allowed. File extension '{file_ext}' is not supported. Supported: images (jpg, png, gif, webp, bmp, svg) and documents (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt, ods)",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine file type. Please ensure the file has a valid extension.",
            )
    
    # Normalize content_type (handle case variations)
    content_type = content_type.lower()
    
    if content_type in ALLOWED_IMAGE_TYPES:
        return "image"
    elif content_type in ALLOWED_DOCUMENT_TYPES:
        return "document"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed: '{content_type}'. Supported: images (jpg, png, gif, webp, bmp, svg) and documents (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt, ods)",
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a file (image or document) for use in messages. No file size limit."""
    file_content = await file.read()

    # Determine file type
    try:
        file_type = get_file_type(file.content_type, file.filename)
    except HTTPException as e:
        # Log the error for debugging
        print(f"File upload error - Content-Type: {file.content_type}, Filename: {file.filename}")
        raise
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Save to appropriate directory
    if file_type == "image":
        save_path = IMAGES_DIR / unique_filename
    else:
        save_path = DOCUMENTS_DIR / unique_filename
    
    # Write file
    with open(save_path, "wb") as f:
        f.write(file_content)
    
    # Return file URL (use 'images' or 'documents' as directory name)
    if file_type == "image":
        file_url = f"/api/uploads/images/{unique_filename}"
    else:
        file_url = f"/api/uploads/documents/{unique_filename}"
    
    return {
        "file_url": file_url,
        "file_type": file_type,
        "file_name": file.filename,
        "file_size": len(file_content),
    }


@router.get("/uploads/{file_type}/{filename}")
async def get_uploaded_file(file_type: str, filename: str):
    """Serve uploaded files."""
    # Handle both singular and plural forms (image/images, document/documents)
    if file_type in ("image", "images"):
        file_path = IMAGES_DIR / filename
        # Try to detect media type from file extension
        file_ext = Path(filename).suffix.lower()
        media_type = EXTENSION_TO_TYPE.get(file_ext, "image/jpeg")
    elif file_type in ("document", "documents"):
        file_path = DOCUMENTS_DIR / filename
        # Try to detect media type from file extension
        file_ext = Path(filename).suffix.lower()
        media_type = EXTENSION_TO_TYPE.get(file_ext, "application/octet-stream")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: '{file_type}'. Use 'images' or 'documents'",
        )
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {filename}",
        )
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
    )
