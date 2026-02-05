from datetime import date, datetime, timezone
from enum import Enum as PyEnum
import logging

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    TypeDecorator,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, PyEnum):
    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PACKED = "packed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


def _normalize_order_status_from_db(value):
    """Convert any DB value (e.g. 'PENDING' or 'pending') to OrderStatus. Never raises."""
    if value is None:
        return None
    if isinstance(value, OrderStatus):
        return value
    if not isinstance(value, str):
        value = value.decode("utf-8") if isinstance(value, bytes) else str(value)
    raw = value
    value = value.lower().strip()
    try:
        return OrderStatus(value)
    except (LookupError, KeyError, ValueError):
        try:
            name = raw.upper().strip()
            if hasattr(OrderStatus, name):
                return getattr(OrderStatus, name)
        except Exception:
            pass
        return OrderStatus.PENDING


class _OrderStatusEnum(Enum):
    """Enum type that normalizes DB values to lowercase before lookup (handles 'PENDING' or 'pending')."""

    def result_processor(self, dialect, coltype):
        def process(value):
            return _normalize_order_status_from_db(value)
        return process


class OrderStatusColumnType(TypeDecorator):
    """Wraps PostgreSQL order_status enum; we own result_processor so dialect never sees raw 'PENDING'."""

    impl = Enum(
        OrderStatus,
        name="order_status",
        create_constraint=False,
        native_enum=True,
        values_callable=lambda obj: [e.value for e in obj],
    )
    cache_ok = True

    def result_processor(self, dialect, coltype):
        # Replace the base Enum's processor entirely so LookupError('PENDING') never happens.
        def process(value):
            return _normalize_order_status_from_db(value)
        return process

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, OrderStatus):
            return value.value
        if isinstance(value, str):
            return value.lower().strip()
        return str(value).lower()


class OrderStatusType(TypeDecorator):
    """TypeDecorator to ensure enum values (lowercase strings) are saved to database."""
    # Use String type instead of Enum to avoid SQLAlchemy's enum validation issues
    # The database column is still an enum type, but we handle conversion manually
    impl = String(50)  # Use String to avoid enum validation problems
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """Convert Python value to database value (lowercase string)."""
        if value is None:
            return value
        
        # ✅ CRITICAL: Always convert to lowercase string for PostgreSQL enum
        # If it's an enum, get its value (lowercase string like "accepted")
        if isinstance(value, OrderStatus):
            result = value.value  # This should be "accepted" (lowercase)
            logger.info(f"TypeDecorator: Converting enum {value} to '{result}'")
            return result
        
        # If it's already a string, ensure it's lowercase and validate
        if isinstance(value, str):
            lower_val = value.lower()
            # Validate it's a valid enum value
            try:
                OrderStatus(lower_val)
                logger.info(f"TypeDecorator: Converting string '{value}' to '{lower_val}'")
                return lower_val
            except ValueError:
                logger.warning(f"TypeDecorator: Invalid enum value '{value}', converting to lowercase anyway")
                return lower_val  # Still return lowercase even if invalid
        
        # Fallback - convert anything else to lowercase string
        result = str(value).lower()
        logger.info(f"TypeDecorator: Fallback conversion of {type(value)} to '{result}'")
        return result
    
    def process_result_value(self, value, dialect):
        """Convert database value to Python enum."""
        if value is None:
            return value
        
        # If it's already an enum, return it
        if isinstance(value, OrderStatus):
            return value
        
        # Convert string to enum - PostgreSQL returns enum values as strings
        if isinstance(value, str):
            # Normalize to lowercase
            lower_val = value.lower().strip()
            
            # Try multiple approaches to convert to enum
            # Approach 1: Direct value matching (OrderStatus("accepted"))
            try:
                return OrderStatus(lower_val)
            except Exception as e1:
                # Approach 2: Manual lookup by iterating enum members
                try:
                    for status_member in OrderStatus:
                        if status_member.value == lower_val:
                            return status_member
                except Exception as e2:
                    pass
                
                # Approach 3: Try uppercase name matching (ACCEPTED -> "accepted")
                try:
                    upper_name = lower_val.upper()
                    if hasattr(OrderStatus, upper_name):
                        return getattr(OrderStatus, upper_name)
                except Exception as e3:
                    pass
                
                # If all conversion attempts fail, return the string value
                # The application code in dashboards.py handles string status values
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Status '{value}' returned as string (enum conversion skipped). This is safe.")
                return lower_val
        
        # For any other type, return as-is
        return value


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deactivated_by_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    products: Mapped[list["Product"]] = relationship(back_populates="farmer")
    orders: Mapped[list["Order"]] = relationship(back_populates="buyer")
    sent_messages: Mapped[list["Message"]] = relationship(back_populates="sender")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(
        Numeric(10, 2), CheckConstraint("price >= 0"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(
        Integer, CheckConstraint("quantity >= 0"), nullable=False
    )
    image_url: Mapped[str | None] = mapped_column(Text)
    min_negotiable_price: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )  # Minimum price farmer can offer (e.g. 15 when listed 20)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    farmer: Mapped[User] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    total_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), CheckConstraint("total_amount >= 0"), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        OrderStatusColumnType(),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True, default="cash")
    buyer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_type: Mapped[str | None] = mapped_column(String(30), nullable=True, default="delivery")
    preferred_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    preferred_time: Mapped[str | None] = mapped_column(String(50), nullable=True)

    buyer: Mapped[User] = relationship(back_populates="orders", lazy="joined")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="joined"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(
        Integer, CheckConstraint("quantity > 0"), nullable=False
    )
    price: Mapped[float] = mapped_column(
        Numeric(10, 2), CheckConstraint("price >= 0"), nullable=False
    )

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product | None] = relationship(back_populates="order_items")


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("buyer_id", "farmer_id", name="uq_buyer_farmer"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    buyer: Mapped[User] = relationship(foreign_keys=[buyer_id], lazy="joined")
    farmer: Mapped[User] = relationship(foreign_keys=[farmer_id], lazy="joined")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)  # text, counter_offer, system
    meta: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON for counter_offer etc.
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # URL to uploaded file
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # image, document
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Original filename
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    sender: Mapped[User] = relationship(back_populates="sent_messages")
    counter_offer: Mapped["CounterOffer | None"] = relationship(
        back_populates="message", uselist=False, cascade="all, delete-orphan"
    )


class CounterOffer(Base):
    """Price negotiation: buyer sends counter offer; farmer accepts or rejects."""
    __tablename__ = "counter_offers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    message_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )
    conversation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # e.g. 15 kg
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)  # counter price
    original_price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, accepted, rejected
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    message: Mapped[Message] = relationship(back_populates="counter_offer")
    product: Mapped["Product"] = relationship()
    buyer: Mapped[User] = relationship(foreign_keys=[buyer_id])
    farmer: Mapped[User] = relationship(foreign_keys=[farmer_id])


class PersonalProductOffer(Base):
    """Special price for a buyer on a product (after farmer accepts counter offer)."""
    __tablename__ = "personal_product_offers"
    __table_args__ = (UniqueConstraint("buyer_id", "product_id", name="uq_buyer_product_offer"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    buyer: Mapped[User] = relationship()
    product: Mapped["Product"] = relationship()


class Negotiation(Base):
    """Dedicated negotiation session: buyer offers, system auto-replies based on min_negotiable_price."""
    __tablename__ = "negotiations"
    __table_args__ = (UniqueConstraint("buyer_id", "product_id", name="uq_buyer_product_negotiation"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="ongoing", nullable=False)  # ongoing, accepted, confirmed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    buyer: Mapped[User] = relationship(foreign_keys=[buyer_id])
    product: Mapped["Product"] = relationship()
    farmer: Mapped[User] = relationship(foreign_keys=[farmer_id])
    messages: Mapped[list["NegotiationMessage"]] = relationship(
        back_populates="negotiation", cascade="all, delete-orphan"
    )


class NegotiationMessage(Base):
    """Single message in a negotiation (buyer offer or system auto-reply)."""
    __tablename__ = "negotiation_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    negotiation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("negotiations.id", ondelete="CASCADE"), nullable=False
    )
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False)  # buyer, system
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    offer_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # price offered by buyer
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    negotiation: Mapped[Negotiation] = relationship(back_populates="messages")


class GroupChat(Base):
    """Group chat (e.g. Free to Ask) where multiple farmers and admin can talk."""
    __tablename__ = "group_chats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_default_for_farmers: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)

    members: Mapped[list["GroupChatMember"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )
    messages: Mapped[list["GroupChatMessage"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class GroupChatMember(Base):
    """Membership of users in a group chat."""
    __tablename__ = "group_chat_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_user"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    group_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("group_chats.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # "admin" or "farmer" for now
    role: Mapped[str] = mapped_column(String(20), default="farmer", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    group: Mapped[GroupChat] = relationship(back_populates="members")
    user: Mapped[User] = relationship()


class GroupChatMessage(Base):
    """Messages inside a group chat."""
    __tablename__ = "group_chat_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    group_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("group_chats.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    group: Mapped[GroupChat] = relationship(back_populates="messages")
    sender: Mapped[User] = relationship()


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    document_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="policy", cascade="all, delete-orphan"
    )


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("user_id", "policy_id", name="uq_user_policy"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    policy_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="notifications")
    policy: Mapped[Policy] = relationship(back_populates="notifications")


class OrderNotification(Base):
    __tablename__ = "order_notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User] = relationship(foreign_keys=[user_id])
    order: Mapped[Order] = relationship(foreign_keys=[order_id])


class AdminMessage(Base):
    """Admin messages to farmers - supports individual and group messages."""
    __tablename__ = "admin_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    farmer_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )  # None means group message to all farmers
    message_text: Mapped[str] = mapped_column(Text, nullable=True, default="")  # Can be empty if file is sent
    message_type: Mapped[str] = mapped_column(
        String(20), default="info", nullable=False
    )  # info, policy, news, announcement
    link_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # Optional link
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # URL to uploaded file
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # image, document
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Original filename
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    farmer: Mapped[User | None] = relationship(foreign_keys=[farmer_id])


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_user_product"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(
        Integer, CheckConstraint("quantity > 0"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship(back_populates="cart_items")


class Rating(Base):
    """Ratings for orders - customers can rate farmers after delivery."""
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("order_id", "user_id", name="uq_order_user_rating"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(
        Integer, CheckConstraint("rating >= 1 AND rating <= 5"), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    order: Mapped[Order] = relationship(foreign_keys=[order_id])
    user: Mapped[User] = relationship(foreign_keys=[user_id])
    farmer: Mapped[User] = relationship(foreign_keys=[farmer_id])


class Complaint(Base):
    """Complaints/Reports for delivered orders - customers can report issues."""
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    farmer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    complaint_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "product_damage", "farmer_issue", "other"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # "pending", "resolved", "dismissed"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_comment: Mapped[str | None] = mapped_column(Text, nullable=True)  # Admin's comment on how issue was resolved
    order: Mapped[Order] = relationship(foreign_keys=[order_id])
    user: Mapped[User] = relationship(foreign_keys=[user_id])
    farmer: Mapped[User] = relationship(foreign_keys=[farmer_id])


class GovernmentNews(Base):
    """Government news and notifications for farmers - fetched from RSS feeds."""
    __tablename__ = "government_news"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(200), nullable=False)  # e.g., "PIB", "Ministry of Agriculture"
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Original article URL
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "MSP", "Policy", "Scheme"
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # For user-specific read status
    is_important: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Mark important news
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
class AppSettings(Base):
    """Application-wide settings controlled by admin."""
    __tablename__ = "app_settings"
    __table_args__ = (UniqueConstraint("setting_key", name="uq_setting_key"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    setting_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    setting_value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    updated_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)  # Admin who updated