"use client"

import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "match_number",
  },
  {
    accessorKey: "team1_name",
    header: "team1_name",
  },
  {
    accessorKey: "team2_name",
    header: "team2_name",
  },
  {
    accessorKey: "team1_score",
    header: "team1_score",
  },
  {
    accessorKey: "team2_score",
    header: "team2_score",
  },
  {
    accessorKey: "result",
    header: "result",
  },
]
