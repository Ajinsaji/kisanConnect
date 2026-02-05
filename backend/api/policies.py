from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import get_current_user, get_db, require_role
from db.models import Notification, Policy, User, UserRole
from schemas.policy import NotificationRead, PolicyCreate, PolicyRead

router = APIRouter()


@router.post(
    "/", response_model=PolicyRead, status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN))]
)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
):
    policy = Policy(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)

    # auto-create notifications for all farmers
    farmers = db.query(User).filter(User.role == UserRole.FARMER).all()
    for farmer in farmers:
        db.add(Notification(user_id=farmer.id, policy_id=policy.id))
    db.commit()
    return policy


@router.get("/", response_model=list[PolicyRead])
def list_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.created_at.desc()).all()


@router.get(
    "/notifications",
    response_model=list[NotificationRead],
    dependencies=[Depends(require_role(UserRole.FARMER))],
)
def list_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post(
    "/notifications/{notification_id}/read",
    response_model=NotificationRead,
    dependencies=[Depends(require_role(UserRole.FARMER))],
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


