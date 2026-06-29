# FORMULAS FINANCIERAS Y DE RIESGOS — BANCO GNB PERÚ
**Sistema:** PortalFinanciero_GNB (Core Admin + Homebanking)  
**Referencia normativa:** SBS Perú — Reglamento de Créditos de Consumo, Resolución SBS N° 11356-2008 y Circular SUNAT (ITF).

---

## 1. CAPA DE ADMISIÓN Y EVALUACIÓN DE CRÉDITO

---

### A. Tasa Efectiva Mensual (TEM / $i_m$)

Convierte la TEA del tarifario al factor mensual de 30 días (año comercial de 360 días del sistema financiero peruano):

$$i_m = \left(1 + \frac{\text{TEA}}{100}\right)^{\frac{30}{360}} - 1$$

| Parámetro | Descripción |
|---|---|
| **TEA** | Tasa Efectiva Anual pactada. Definida por el Checker 1 en el rango **13% – 36%** (`dparametros_credito`). |
| **$i_m$** | Tasa Efectiva Mensual resultante, usada para el cálculo de intereses ordinarios. |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_creditos.py  →  función evaluar_credito()  →  línea 96
```
```python
im = (1 + float(tea_ref)/100.0)**(30.0/360.0) - 1
```

---

### B. Seguro de Desgravamen Colectivo Mensual ($SD$)

Banco GNB Perú aplica una tasa fija de **0.0738% mensual** sobre el saldo pendiente de capital ($MP$):

$$SD = \left[\left(1 + \frac{0.0738}{100}\right)^{\frac{t}{30}} - 1\right] \times MP$$

| Parámetro | Descripción |
|---|---|
| **$SD$** | Prima mensual del Seguro de Desgravamen a cobrar en la cuota. |
| **$MP$** | Saldo insoluto de capital al inicio del período. |
| **$t$** | Días del período de facturación (30 días constantes en simulación). |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_creditos.py  →  función evaluar_credito()  →  línea 103-105
```
```python
tasa_sd = 0.000738
sd = float(monto) * tasa_sd
```

---

### C. Impuesto a las Transacciones Financieras ($\text{ITF}$)

Impuesto SUNAT con tasa vigente de **0.005%** sobre el monto total de amortización + intereses + seguro:

$$\text{ITF} = 0.00005 \times \left(\frac{MP \times i_m}{1 - (1 + i_m)^{-n}} + SD\right)$$

| Parámetro | Descripción |
|---|---|
| **$\text{ITF}$** | Impuesto a las Transacciones Financieras devengado por cuota. |
| **$n$** | Número de cuotas totales del préstamo (plazo en meses). |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_creditos.py  →  función evaluar_credito()  →  línea 104-106
```
```python
tasa_itf = 0.00005
itf = (cuota_pura + sd) * tasa_itf
```

---

### D. Cuota Total Mensual del Cliente ($C$)

Cuota final constante del deudor bajo el método de amortización francés (cuota constante):

$$C = \frac{MP \times i_m}{1 - (1 + i_m)^{-n}} + SD + \text{ITF}$$

| Parámetro | Descripción |
|---|---|
| **$C$** | Cuota mensual total que paga el deudor. |
| **$\frac{MP \times i_m}{1-(1+i_m)^{-n}}$** | Porción de capital + interés ordinario (cuota pura francesa). |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_creditos.py  →  función evaluar_credito()  →  línea 107
app/repositories/repo_creditos.py →  función evaluar_solicitud() (cronograma)
```
```python
c = cuota_pura + sd + itf
```

---

### E. Capital Amortizado Neto de la Cuota ($A$)

Porción de la cuota mensual que reduce directamente el saldo insoluto (capital neto):

$$A = C - SD - I - \text{ITF}$$

| Parámetro | Descripción |
|---|---|
| **$A$** | Amortización neta de capital de la cuota actual. |
| **$I$** | Interés compensatorio ordinario: $I = MP \times i_m$. |

**Ubicación en el proyecto:**

```
app/repositories/repo_creditos.py  →  función evaluar_solicitud() (generador de cronograma)
```
```python
interes = saldo * im
capital = cuota - interes  # equivalente a A = C - SD - I - ITF simplificado
```

---

### F. Ratio de Endeudamiento ($DTI$ — Debt to Income)

Filtro duro del MAKER. Si supera **40.0%** del ingreso neto mensual verificado, el Core lanza `HTTP 400` automático:

$$\text{DTI} = \left(\frac{C}{\text{Ingreso Neto Mensual}}\right) \times 100$$

| Parámetro | Descripción |
|---|---|
| **$\text{DTI}$** | Ratio de endeudamiento en porcentaje. Límite máximo: **40.0%**. |
| **Ingreso Neto Mensual** | Sueldo verificado en boleta Cloudinary. Mínimo: dependientes S/ 1,200 / independientes S/ 2,500. |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_creditos.py  →  función evaluar_credito()  →  línea 109-112
```
```python
dti = (c / float(ingreso_neto)) * 100
if dti > 40.0:
    raise HTTPException(status_code=400, detail="Rechazado: Capacidad de endeudamiento excedida")
```

---

## 2. CAPA DE POST-VENTA, RECUPERACIONES Y MORA

---

### A. Cálculo del Interés Moratorio ($IM$)

Se calcula sobre la porción de **capital** de la cuota vencida desde el primer día de retraso. Banco GNB usa tasa moratoria nominal anual de **15.50%**:

$$IM = \left(\frac{i_{\text{mora}} \times \text{días}}{360}\right) \times A$$

| Parámetro | Descripción |
|---|---|
| **$IM$** | Interés moratorio acumulado sobre la cuota vencida. |
| **$i_{\text{mora}}$** | Tasa nominal anual moratoria de Banco GNB: **15.50%** (0.155). |
| **días** | Días efectivos de atraso (`diasatrasocredito` en `fagcuentacredito`). |
| **$A$** | Capital amortizado pendiente de la cuota vencida. |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_mora.py  →  función procesar_fin_de_dia_mora()  →  líneas 34-38
```
```python
capital_amortizado = c['montocapitalprogramado'] - c['montocapitalpagado']
tasa_mora_anual = c['tasainteresmoratoria'] or Decimal('0.155')

# IM = (i_mora * t / 360) * A_v
interes_mora = (tasa_mora_anual * Decimal(dias_atraso) / Decimal(360)) * capital_amortizado
```

---

### B. Capitalización Diaria — EOD Batch (Cuenta Rolando)

La Cuenta Ahorro Rolando capitaliza y abona intereses diariamente al cierre del día (proceso Batch nocturno). TEA pasiva: **4.50% en soles**:

$$i_d = \left(1 + \frac{\text{TEA}}{100}\right)^{\frac{1}{360}} - 1$$

$$\text{Interés}_{\text{día}} = i_d \times \text{Saldo}$$

| Parámetro | Descripción |
|---|---|
| **$i_d$** | Factor diario de tasa de interés compuesto. |
| **Saldo** | Saldo disponible al cierre contable (`montosaldodisponible_ac` en `fcuentaahorro`). |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_eod_batch.py  →  función capitalizar_ahorro_rolando()  →  líneas 31-32
```
```python
# Fórmula: i_d = (1 + TEA/100)^(1/360) - 1
id_factor = Decimal(math.pow(1 + float(tea)/100.0, 1.0/360.0) - 1)
interes_dia = round(saldo * id_factor, 2)
```

---

## 3. CAPA ANALÍTICA DEL CORE (DASHBOARD DE DIRECTORIO)

Los KPIs del Dashboard se calculan en SQL sobre `fagcuentacredito` y se presentan en el panel del Superadmin.

---

### A. Ratio de Mora Global

Porcentaje de la cartera en situación atrasada (Vencida + Cobranza Judicial) sobre el total de cartera bruta. **Referencia real Banco GNB: 4.31%**:

$$\text{Ratio de Mora Global} = \left(\frac{\text{Cartera Atrasada}}{\text{Cartera Bruta Total}}\right) \times 100$$

| Parámetro | Campo BD | Descripción |
|---|---|---|
| **Cartera Atrasada** | `SUM(montosaldovencido)` en `fagcuentacredito` | Suma de saldos vencidos + en cobranza judicial. |
| **Cartera Bruta Total** | `SUM(montoaprobadocredito)` en `fagcuentacredito` | Total de colocaciones brutas del período. |

**Ubicación en el proyecto:**

```
app/repositories/repo_admin.py  →  función stats_globales()  →  consulta SBS sobre fagcuentacredito
Valor de referencia (hardcoded para dashboard): 4.31%
```

---

### B. Ratio de Cartera Pesada ($CP$)

Indicador SBS que cuantifica la cartera en riesgo (CPP + Deficiente + Dudoso + Pérdida). **Referencia real Banco GNB: 4.40%**:

$$\text{Ratio de Cartera Pesada} = \left(\frac{\text{Saldos CPP} + \text{Deficiente} + \text{Dudoso} + \text{Pérdida}}{\text{Cartera Bruta Total}}\right) \times 100$$

| Categoría SBS | Semáforo | Días de atraso |
|---|---|---|
| CPP (Con Problemas Potenciales) | 🟡 Amarillo | 9 – 30 días |
| Deficiente | 🟠 Naranja | 31 – 60 días |
| Dudoso | 🔴 Rojo | 61 – 120 días |
| Pérdida | 🔴🔴 Rojo Oscuro | > 120 días |

**Ubicación en el proyecto:**

```
app/controllers/ctrl_mora.py    →  función _clasificar_categoria_sbs()  →  líneas 7-12
app/repositories/repo_admin.py  →  función stats_globales()  →  consulta cartera_sbs (pkcalificacioncrediticiainterna)
Valor de referencia (hardcoded para dashboard): 4.40%
```
```python
def _clasificar_categoria_sbs(dias_atraso: int) -> int:
    if dias_atraso <= 8:  return 0  # Normal
    elif dias_atraso <= 30: return 1  # CPP
    elif dias_atraso <= 60: return 2  # Deficiente
    elif dias_atraso <= 120: return 3  # Dudoso
    else: return 4  # Pérdida
```

---

### C. Ratio de Cobertura de Provisiones

Capacidad del banco para respaldar su Cartera de Alto Riesgo (CAR) con provisiones contables acumuladas. **Referencia real Banco GNB: 127.40%**:

$$\text{Ratio de Cobertura} = \left(\frac{\text{Provisiones Totales}}{\text{Cartera de Alto Riesgo}}\right) \times 100$$

| Parámetro | Campo BD | Descripción |
|---|---|---|
| **Provisiones Totales** | `SUM(saldoprovisiones)` en `fagcuentacredito` | Provisiones acumuladas contabilizadas. |
| **Cartera de Alto Riesgo** | Vencida + Judicial + Refinanciada | Cartera con probabilidad de pérdida. |

**Ubicación en el proyecto:**

```
app/repositories/repo_admin.py  →  función stats_globales()  →  consulta SBS sobre fagcuentacredito
Valor de referencia (hardcoded para dashboard): 127.40%
```

---

## RESUMEN — MAPA FÓRMULA → ARCHIVO → FUNCIÓN → LÍNEA

| Fórmula | Archivo | Función | Línea aprox. |
|---|---|---|---|
| $i_m$ — TEM | `ctrl_creditos.py` | `evaluar_credito()` | L96 |
| $SD$ — Desgravamen | `ctrl_creditos.py` | `evaluar_credito()` | L103–105 |
| $\text{ITF}$ | `ctrl_creditos.py` | `evaluar_credito()` | L104–106 |
| $C$ — Cuota total | `ctrl_creditos.py` | `evaluar_credito()` | L107 |
| $A$ — Amortización | `repo_creditos.py` | `evaluar_solicitud()` | (cronograma) |
| $DTI$ | `ctrl_creditos.py` | `evaluar_credito()` | L109–112 |
| $IM$ — Mora | `ctrl_mora.py` | `procesar_fin_de_dia_mora()` | L34–38 |
| $i_d$ — EOD Rolando | `ctrl_eod_batch.py` | `capitalizar_ahorro_rolando()` | L31–32 |
| Ratio Mora Global | `repo_admin.py` | `stats_globales()` | SQL `fagcuentacredito` |
| Ratio Cartera Pesada | `ctrl_mora.py` + `repo_admin.py` | `_clasificar_categoria_sbs()` | L7–12 |
| Ratio Cobertura | `repo_admin.py` | `stats_globales()` | SQL `fagcuentacredito` |
