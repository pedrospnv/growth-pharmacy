export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          desconto_percentual: number
          id: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          desconto_percentual: number
          id?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          desconto_percentual?: number
          id?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cep: string
          cidade: string
          codigo_rastreio: string | null
          criado_em: string
          cupom: string | null
          desconto_cupom: number
          desconto_pix: number
          devolucao_solicitada_em: string | null
          email: string
          endereco: string
          entregue_em: string | null
          estado: string
          forma_pagamento: string
          frete: number
          id: string
          itens: Json
          mercadopago_payment_id: string | null
          motivo_devolucao: string | null
          nome_cliente: string
          status: string
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          cep: string
          cidade: string
          codigo_rastreio?: string | null
          criado_em?: string
          cupom?: string | null
          desconto_cupom?: number
          desconto_pix?: number
          devolucao_solicitada_em?: string | null
          email: string
          endereco: string
          entregue_em?: string | null
          estado: string
          forma_pagamento: string
          frete?: number
          id?: string
          itens: Json
          mercadopago_payment_id?: string | null
          motivo_devolucao?: string | null
          nome_cliente: string
          status?: string
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          cep?: string
          cidade?: string
          codigo_rastreio?: string | null
          criado_em?: string
          cupom?: string | null
          desconto_cupom?: number
          desconto_pix?: number
          devolucao_solicitada_em?: string | null
          email?: string
          endereco?: string
          entregue_em?: string | null
          estado?: string
          forma_pagamento?: string
          frete?: number
          id?: string
          itens?: Json
          mercadopago_payment_id?: string | null
          motivo_devolucao?: string | null
          nome_cliente?: string
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria: string
          created_at: string
          desconto: number | null
          descricao: string | null
          destaque: boolean | null
          estoque: number
          id: string
          imagem_url: string | null
          nome: string
          preco: number
        }
        Insert: {
          categoria: string
          created_at?: string
          desconto?: number | null
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number
          id?: string
          imagem_url?: string | null
          nome: string
          preco?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          desconto?: number | null
          descricao?: string | null
          destaque?: boolean | null
          estoque?: number
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          email: string | null
          estado: string | null
          id: string
          nome: string | null
          numero: string | null
          rua: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id: string
          nome?: string | null
          numero?: string | null
          rua?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id?: string
          nome?: string | null
          numero?: string | null
          rua?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "funcionario"],
    },
  },
} as const
