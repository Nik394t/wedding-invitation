/* Единая грамматика движения: бумага раскрывается, фото проявляется, чернила ложатся. */
export const easePaper = [0.22, 1, 0.36, 1] as const
export const easeFold = [0.65, 0, 0.25, 1] as const

export const duration = {
  ink: 0.7,
  script: 1.15,
  paper: 0.95,
  photo: 1.4,
} as const
