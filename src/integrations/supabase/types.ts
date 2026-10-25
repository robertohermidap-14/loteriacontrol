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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      albaran_copias: {
        Row: {
          albaran_id: string
          creado_at: string
          creado_por: string
          expires_at: string
          id: string
          token_hash: string
        }
        Insert: {
          albaran_id: string
          creado_at?: string
          creado_por: string
          expires_at?: string
          id?: string
          token_hash: string
        }
        Update: {
          albaran_id?: string
          creado_at?: string
          creado_por?: string
          expires_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "albaran_copias_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes: {
        Row: {
          cobrado_por: string
          estado: string
          fecha: string
          fecha_pago: string | null
          firma: string
          firma_cobro: string
          id: string
          lineas: Json
          local_id: string
          loteria: string
          receptor_dni: string
          receptor_nombre: string
          tipo: string
          total: number
        }
        Insert: {
          cobrado_por?: string
          estado?: string
          fecha?: string
          fecha_pago?: string | null
          firma?: string
          firma_cobro?: string
          id: string
          lineas?: Json
          local_id: string
          loteria?: string
          receptor_dni?: string
          receptor_nombre?: string
          tipo?: string
          total?: number
        }
        Update: {
          cobrado_por?: string
          estado?: string
          fecha?: string
          fecha_pago?: string | null
          firma?: string
          firma_cobro?: string
          id?: string
          lineas?: Json
          local_id?: string
          loteria?: string
          receptor_dni?: string
          receptor_nombre?: string
          tipo?: string
          total?: number
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          creado_por: string
          dia: string
          esperado_bizum: number
          esperado_efectivo: number
          esperado_tarjeta: number
          fecha: string
          id: string
          notas: string
          real_bizum: number
          real_efectivo: number
          real_tarjeta: number
          usuario_id: string
        }
        Insert: {
          creado_por: string
          dia: string
          esperado_bizum: number
          esperado_efectivo: number
          esperado_tarjeta: number
          fecha?: string
          id?: string
          notas?: string
          real_bizum: number
          real_efectivo: number
          real_tarjeta: number
          usuario_id: string
        }
        Update: {
          creado_por?: string
          dia?: string
          esperado_bizum?: number
          esperado_efectivo?: number
          esperado_tarjeta?: number
          fecha?: string
          id?: string
          notas?: string
          real_bizum?: number
          real_efectivo?: number
          real_tarjeta?: number
          usuario_id?: string
        }
        Relationships: []
      }
      cierres_loteria: {
        Row: {
          creado_por: string
          dia: string
          esperado_bizum: number
          esperado_efectivo: number
          esperado_tarjeta: number
          fecha: string
          id: string
          loteria: string
          notas: string
          real_bizum: number
          real_efectivo: number
          real_tarjeta: number
          usuario_id: string
        }
        Insert: {
          creado_por: string
          dia: string
          esperado_bizum: number
          esperado_efectivo: number
          esperado_tarjeta: number
          fecha?: string
          id?: string
          loteria?: string
          notas?: string
          real_bizum: number
          real_efectivo: number
          real_tarjeta: number
          usuario_id: string
        }
        Update: {
          creado_por?: string
          dia?: string
          esperado_bizum?: number
          esperado_efectivo?: number
          esperado_tarjeta?: number
          fecha?: string
          id?: string
          loteria?: string
          notas?: string
          real_bizum?: number
          real_efectivo?: number
          real_tarjeta?: number
          usuario_id?: string
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          direccion: string
          email: string
          id: number
          logo: string
          nif: string
          nombre: string
          razon_social: string
          telefono: string
          updated_at: string
        }
        Insert: {
          direccion?: string
          email?: string
          id?: number
          logo?: string
          nif?: string
          nombre?: string
          razon_social?: string
          telefono?: string
          updated_at?: string
        }
        Update: {
          direccion?: string
          email?: string
          id?: number
          logo?: string
          nif?: string
          nombre?: string
          razon_social?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      decimos: {
        Row: {
          cantidad: number
          created_at: string
          estado: string
          fraccion: string
          id: string
          loteria: string
          numero: string
          serie: string
          ubicacion: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          estado?: string
          fraccion?: string
          id: string
          loteria?: string
          numero: string
          serie?: string
          ubicacion?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          estado?: string
          fraccion?: string
          id?: string
          loteria?: string
          numero?: string
          serie?: string
          ubicacion?: string
        }
        Relationships: []
      }
      liquidacion_solicitudes: {
        Row: {
          albaran_id: string
          fecha: string
          firma: string
          importe: number
          lineas: Json
          solicitud: string
          usuario_id: string
        }
        Insert: {
          albaran_id: string
          fecha?: string
          firma: string
          importe: number
          lineas: Json
          solicitud: string
          usuario_id: string
        }
        Update: {
          albaran_id?: string
          fecha?: string
          firma?: string
          importe?: number
          lineas?: Json
          solicitud?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_solicitudes_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          codigo_cliente: number
          created_at: string
          direccion: string
          dni: string
          email: string
          id: string
          nombre: string
          persona: string
          telefono: string
        }
        Insert: {
          codigo_cliente?: number
          created_at?: string
          direccion?: string
          dni?: string
          email?: string
          id: string
          nombre: string
          persona?: string
          telefono?: string
        }
        Update: {
          codigo_cliente?: number
          created_at?: string
          direccion?: string
          dni?: string
          email?: string
          id?: string
          nombre?: string
          persona?: string
          telefono?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          albaran_id: string
          fecha: string
          firma: string
          historico: boolean
          id: string
          importe: number
          loteria: string
          metodo: string
          nombre: string
          solicitud: string | null
          usuario_id: string | null
        }
        Insert: {
          albaran_id: string
          fecha?: string
          firma?: string
          historico?: boolean
          id?: string
          importe: number
          loteria?: string
          metodo: string
          nombre?: string
          solicitud?: string | null
          usuario_id?: string | null
        }
        Update: {
          albaran_id?: string
          fecha?: string
          firma?: string
          historico?: boolean
          id?: string
          importe?: number
          loteria?: string
          metodo?: string
          nombre?: string
          solicitud?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_albaran_id_fkey"
            columns: ["albaran_id"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellidos: string
          codigo: string
          created_at: string
          id: string
          nombre: string
          telefono: string
        }
        Insert: {
          apellidos?: string
          codigo?: string
          created_at?: string
          id: string
          nombre?: string
          telefono?: string
        }
        Update: {
          apellidos?: string
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          telefono?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      cerrar_caja: {
        Args: {
          p_bizum: number
          p_dia: string
          p_efectivo: number
          p_notas: string
          p_tarjeta: number
          p_usuario: string
        }
        Returns: undefined
      }
      cerrar_caja_loteria: {
        Args: {
          p_bizum: number
          p_dia: string
          p_efectivo: number
          p_loteria: string
          p_notas: string
          p_tarjeta: number
          p_usuario: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      leer_copia_albaran: { Args: { p_hash: string }; Returns: Json }
      registrar_cobro: {
        Args: {
          p_firma: string
          p_id: string
          p_importe: number
          p_lineas: Json
          p_metodo: string
          p_solicitud: string
        }
        Returns: undefined
      }
      vender_decimo: {
        Args: { p_loteria: string; p_numero: string; p_solicitud: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "comercial"
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
      app_role: ["admin", "comercial"],
    },
  },
} as const
