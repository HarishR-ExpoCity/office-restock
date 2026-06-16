export type RequestStatus = "low" | "out" | "new_item";

export interface Item {
  id: string;
  name: string;
  category: string | null;
  active: boolean;
  created_at: string;
}

export interface RestockRequest {
  id: string;
  item_id: string | null;
  status: RequestStatus;
  note: string | null;
  reporter: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

// A request joined with its item (used in the dashboard list).
export interface RequestWithItem extends RestockRequest {
  items: Pick<Item, "name" | "category"> | null;
}
